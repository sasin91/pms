import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../users/role.enum';

export class LoginUserDto {
  @ApiProperty({
    description: 'Authenticated account email.',
    example: 'alice@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'Authorization role assigned to the account.',
    enum: Role,
    example: Role.User,
  })
  role: Role;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT bearer token used to authorize protected requests.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Public details for the authenticated account.',
    type: LoginUserDto,
  })
  user: LoginUserDto;
}
