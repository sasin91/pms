import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { getDatabaseUrl } from '../src/common/database-url';
import { ERROR_MESSAGES } from '../src/common/error-messages';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
});

async function seed(): Promise<void> {
  await prisma.patient.upsert({
    where: { id: 'patient-1' },
    update: {},
    create: {
      id: 'patient-1',
      firstName: 'Alice',
      lastName: 'Andersen',
      dateOfBirth: '1990-04-12',
      email: 'alice@example.com',
    },
  });

  await prisma.patient.upsert({
    where: { id: 'patient-2' },
    update: {},
    create: {
      id: 'patient-2',
      firstName: 'Bob',
      lastName: 'Berg',
      dateOfBirth: '1985-09-23',
      email: 'bob@example.com',
    },
  });

  const users = [
    {
      id: 'admin-1',
      email: 'admin@example.com',
      password: 'admin-password',
      role: Role.admin,
      patientId: null,
    },
    {
      id: 'user-1',
      email: 'alice@example.com',
      password: 'user-password',
      role: Role.user,
      patientId: 'patient-1',
    },
    {
      id: 'user-2',
      email: 'bob@example.com',
      password: 'user-password',
      role: Role.user,
      patientId: 'patient-2',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        patientId: user.patientId,
      },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: hashSync(user.password, 12),
        role: user.role,
        patientId: user.patientId,
      },
    });
  }
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(ERROR_MESSAGES.database.seedFailed, error);
    await prisma.$disconnect();
    process.exit(1);
  });
