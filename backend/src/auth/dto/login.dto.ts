import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email address used to authenticate the account.',
    example: 'alice@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Account password.',
    example: 'user-password',
    minLength: 8,
    writeOnly: true,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
