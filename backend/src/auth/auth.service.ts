import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import type { AuthenticatedUser, JwtPayload } from './auth.types';
import type { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    return this.usersService.validateCredentials(email, password);
  }

  login(user: AuthenticatedUser): LoginResponseDto {
    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      ...(user.patientId ? { patientId: user.patientId } : {}),
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        email: user.email,
        role: user.role,
      },
    };
  }
}
