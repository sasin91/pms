import type { JwtModuleOptions } from '@nestjs/jwt';
import { ERROR_MESSAGES } from '../common/error-messages';

const DEVELOPMENT_SECRET =
  'development-only-secret-change-me-before-production-32-characters';
const DEFAULT_JWT_EXPIRES_IN = '1h';

type JwtExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(ERROR_MESSAGES.auth.jwtSecretRequired);
  }

  return DEVELOPMENT_SECRET;
}

export function getJwtExpiresIn(): JwtExpiresIn {
  return (process.env.JWT_EXPIRES_IN ?? DEFAULT_JWT_EXPIRES_IN) as JwtExpiresIn;
}
