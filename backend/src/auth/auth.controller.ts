import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './authenticated-request';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LocalAuthGuard } from './local-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Authenticate with email and password',
    description:
      'Returns a signed JWT and the public identity of the authenticated account.',
  })
  @ApiCreatedResponse({
    description: 'Authentication succeeded.',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The email or password is invalid.',
    type: ErrorResponseDto,
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @Body() credentials: LoginDto,
    @Req() request: AuthenticatedRequest,
  ): LoginResponseDto {
    void credentials;
    return this.authService.login(request.user);
  }
}
