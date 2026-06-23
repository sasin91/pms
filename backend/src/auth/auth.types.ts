import { Role } from '../users/role.enum';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  patientId?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  patientId?: string;
}
