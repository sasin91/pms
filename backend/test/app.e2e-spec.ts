import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { PrismaService } from './../src/prisma/prisma.service';

interface LoginResponse {
  token: string;
  user: {
    email: string;
    role: 'admin' | 'user';
  };
}

interface TokenClaims {
  sub: string;
  email: string;
  role: 'admin' | 'user';
  patientId?: string;
}

interface PatientResponse {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
}

interface PatientPageResponse {
  data: PatientResponse[];
  page: number;
  limit: number;
  total: number;
}

interface OpenApiDocument {
  paths: Record<
    string,
    {
      get?: {
        parameters?: Array<{
          name: string;
          schema: {
            type?: string;
            allOf?: unknown[];
          };
        }>;
      };
    }
  >;
  components: {
    schemas: Record<
      string,
      {
        required?: string[];
        properties?: Record<string, { format?: string; example?: unknown }>;
      }
    >;
  };
}

describe('Authentication and patient authorization (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    await app.get(PrismaService).patient.deleteMany({
      where: { id: { notIn: ['patient-1', 'patient-2'] } },
    });
  });

  async function login(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return (response.body as LoginResponse).token;
  }

  function decodeClaims(token: string): TokenClaims {
    const encodedPayload = token.split('.')[1];
    return JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as TokenClaims;
  }

  it('publishes annotated OpenAPI schemas for the API DTOs', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const document = response.body as OpenApiDocument;

    expect(document.paths).toHaveProperty('/auth/login');
    expect(document.paths).toHaveProperty('/patients');
    expect(document.components.schemas.LoginDto).toMatchObject({
      required: ['email', 'password'],
      properties: {
        email: { format: 'email', example: 'alice@example.com' },
        password: { example: 'user-password' },
      },
    });
    expect(
      document.components.schemas.PatientPageDto.properties?.data,
    ).toBeDefined();

    const paginationParameters =
      document.paths['/patients'].get?.parameters ?? [];
    expect(
      paginationParameters.find((parameter) => parameter.name === 'page')
        ?.schema.type,
    ).toBe('number');
    expect(
      paginationParameters.find((parameter) => parameter.name === 'limit')
        ?.schema.type,
    ).toBe('number');
    expect(
      paginationParameters.some((parameter) => parameter.schema.allOf),
    ).toBe(false);
  });

  it('returns 401 for invalid login credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'wrong' })
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });

  it('returns 401 when login credentials are missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({})
      .expect(401);

    expect(response.body).toMatchObject({ statusCode: 401 });
  });

  it('returns 401 when a protected route has no bearer token', async () => {
    const response = await request(app.getHttpServer())
      .get('/patients')
      .expect(401);

    expect(response.body).toMatchObject({ statusCode: 401 });
  });

  it('logs in with email and returns the token and public user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'admin-password' })
      .expect(201);
    const login = response.body as LoginResponse;

    expect(login.user).toEqual({
      email: 'admin@example.com',
      role: 'admin',
    });
    expect(typeof login.token).toBe('string');
    expect(decodeClaims(login.token)).toMatchObject({
      sub: 'admin-1',
      email: 'admin@example.com',
      role: 'admin',
    });
  });

  it('returns a paginated patient collection', async () => {
    const token = await login('admin@example.com', 'admin-password');
    const response = await request(app.getHttpServer())
      .get('/patients?page=1&limit=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body as PatientPageResponse).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
    });
    expect((response.body as PatientPageResponse).data).toHaveLength(1);
  });

  it('limits user reads to the associated patient', async () => {
    const token = await login('alice@example.com', 'user-password');
    const authorization = `Bearer ${token}`;

    const list = await request(app.getHttpServer())
      .get('/patients')
      .set('Authorization', authorization)
      .expect(200);
    const page = list.body as PatientPageResponse;

    expect(page.total).toBe(1);
    expect(page.data.map((patient) => patient.id)).toEqual(['patient-1']);

    await request(app.getHttpServer())
      .get('/patients/patient-1')
      .set('Authorization', authorization)
      .expect(200);

    await request(app.getHttpServer())
      .get('/patients/patient-2')
      .set('Authorization', authorization)
      .expect(403);
  });

  it('allows only admins to create patients', async () => {
    const adminToken = await login('admin@example.com', 'admin-password');
    const userToken = await login('alice@example.com', 'user-password');
    const patientInput = {
      firstName: 'Create',
      lastName: 'Test',
      dateOfBirth: '2000-01-01',
      email: 'create-test@example.com',
    };

    await request(app.getHttpServer())
      .post('/patients')
      .set('Authorization', `Bearer ${userToken}`)
      .send(patientInput)
      .expect(403);

    const response = await request(app.getHttpServer())
      .post('/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(patientInput)
      .expect(201);
    const patient = response.body as PatientResponse;

    expect(patient).toMatchObject(patientInput);
    expect(typeof patient.id).toBe('string');

    await request(app.getHttpServer())
      .delete(`/patients/${patient.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('allows only admins to replace a patient with PUT', async () => {
    const adminToken = await login('admin@example.com', 'admin-password');
    const userToken = await login('alice@example.com', 'user-password');
    const created = await request(app.getHttpServer())
      .post('/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Before',
        lastName: 'Update',
        dateOfBirth: '2000-01-01',
      })
      .expect(201);
    const patient = created.body as PatientResponse;
    const replacement = {
      firstName: 'After',
      lastName: 'Replacement',
      dateOfBirth: '1999-12-31',
      email: 'replacement@example.com',
    };

    await request(app.getHttpServer())
      .put(`/patients/${patient.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(replacement)
      .expect(403);

    const response = await request(app.getHttpServer())
      .put(`/patients/${patient.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(replacement)
      .expect(200);

    expect(response.body).toEqual({ id: patient.id, ...replacement });

    await request(app.getHttpServer())
      .delete(`/patients/${patient.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('allows only admins to delete patients and returns ok', async () => {
    const adminToken = await login('admin@example.com', 'admin-password');
    const userToken = await login('alice@example.com', 'user-password');
    const created = await request(app.getHttpServer())
      .post('/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Delete',
        lastName: 'Test',
        dateOfBirth: '2000-01-01',
      })
      .expect(201);
    const patient = created.body as PatientResponse;

    await request(app.getHttpServer())
      .delete(`/patients/${patient.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    const response = await request(app.getHttpServer())
      .delete(`/patients/${patient.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toEqual({ ok: true });

    await request(app.getHttpServer())
      .get(`/patients/${patient.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('returns 401 when a JWT has expired', async () => {
    const token = await login('alice@example.com', 'user-password');

    await new Promise((resolve) => setTimeout(resolve, 2100));

    const response = await request(app.getHttpServer())
      .get('/patients/patient-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(response.body).toMatchObject({ statusCode: 401 });
  });

  it('returns 401 for a malformed JWT', async () => {
    const response = await request(app.getHttpServer())
      .get('/patients')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);

    expect(response.body).toMatchObject({ statusCode: 401 });
  });

  it('returns 401 for a JWT with a tampered signature', async () => {
    const token = await login('alice@example.com', 'user-password');
    const [header, payload, signature] = token.split('.');
    const replacement = signature.startsWith('a') ? 'b' : 'a';
    const tamperedToken = `${header}.${payload}.${replacement}${signature.slice(1)}`;

    const response = await request(app.getHttpServer())
      .get('/patients')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(401);

    expect(response.body).toMatchObject({ statusCode: 401 });
  });

  it('can simulate a transient API failure when explicitly enabled', async () => {
    const token = await login('admin@example.com', 'admin-password');
    process.env.API_SIMULATION_ENABLED = 'true';
    process.env.API_FAILURE_RATE = '1';
    process.env.API_MIN_LATENCY_MS = '0';
    process.env.API_MAX_LATENCY_MS = '0';

    try {
      const response = await request(app.getHttpServer())
        .get('/patients')
        .set('Authorization', `Bearer ${token}`)
        .expect(503);

      expect(response.body).toMatchObject({ statusCode: 503 });
    } finally {
      delete process.env.API_SIMULATION_ENABLED;
      delete process.env.API_FAILURE_RATE;
      delete process.env.API_MIN_LATENCY_MS;
      delete process.env.API_MAX_LATENCY_MS;
    }
  });

  it('can simulate API latency without forcing a failure', async () => {
    const token = await login('admin@example.com', 'admin-password');
    process.env.API_SIMULATION_ENABLED = 'true';
    process.env.API_FAILURE_RATE = '0';
    process.env.API_MIN_LATENCY_MS = '75';
    process.env.API_MAX_LATENCY_MS = '75';
    const startedAt = Date.now();

    try {
      await request(app.getHttpServer())
        .get('/patients')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(65);
    } finally {
      delete process.env.API_SIMULATION_ENABLED;
      delete process.env.API_FAILURE_RATE;
      delete process.env.API_MIN_LATENCY_MS;
      delete process.env.API_MAX_LATENCY_MS;
    }
  });

  afterAll(async () => {
    await app.close();
  });
});
