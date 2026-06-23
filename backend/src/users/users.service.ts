import { Injectable } from '@nestjs/common';
import type { User as PrismaUser } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from './password';
import { Role } from './role.enum';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toAuthenticatedUser(user) : null;
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return null;
    }

    return this.toAuthenticatedUser(user);
  }

  private toAuthenticatedUser(user: PrismaUser): AuthenticatedUser {
    return {
      userId: user.id,
      email: user.email,
      role: user.role === 'admin' ? Role.Admin : Role.User,
      ...(user.patientId ? { patientId: user.patientId } : {}),
    };
  }
}
