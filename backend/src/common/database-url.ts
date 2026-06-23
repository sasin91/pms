import { ERROR_MESSAGES } from './error-messages';

const DEFAULT_POSTGRES_DATABASE = 'postgres';

export function getDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(ERROR_MESSAGES.database.urlRequired);
  }

  const url = new URL(connectionString);

  if (!url.pathname || url.pathname === '/') {
    url.pathname = DEFAULT_POSTGRES_DATABASE;
  }

  return url.toString();
}
