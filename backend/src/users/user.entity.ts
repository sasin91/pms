import { Role } from './role.enum';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  patientId?: string;
}
