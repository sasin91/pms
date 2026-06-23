export const ERROR_MESSAGES = {
  database: {
    urlRequired: 'DATABASE_URL must be set',
    seedFailed: 'Database seed failed',
  },
  resilience: {
    transientFailure: 'Simulated transient failure',
  },
  auth: {
    invalidCredentials: 'Invalid email or password',
    unauthorized: 'Authentication is required',
    roleForbidden: 'Your role does not permit this operation',
    jwtSecretRequired: 'JWT_SECRET must be set in production',
  },
  patient: {
    readForbidden: 'You can only access your associated patient record',
    requiredFields:
      'firstName, lastName, and dateOfBirth (YYYY-MM-DD) are required',
    invalidEmail: 'email must be a non-empty string',
    notFound: (id: string) => `Patient ${id} was not found`,
  },
} as const;
