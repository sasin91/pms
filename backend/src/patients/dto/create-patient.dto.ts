import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({
    description: 'Patient given name.',
    example: 'Alice',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    description: 'Patient family name.',
    example: 'Andersen',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({
    description: 'Patient date of birth in ISO calendar-date format.',
    example: '1990-04-12',
    format: 'date',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth: string;

  @ApiPropertyOptional({
    description: 'Patient contact email.',
    example: 'alice@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
