import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientDto {
  @ApiProperty({
    description: 'Stable patient identifier.',
    example: 'patient-1',
  })
  id: string;

  @ApiProperty({
    description: 'Patient given name.',
    example: 'Alice',
  })
  firstName: string;

  @ApiProperty({
    description: 'Patient family name.',
    example: 'Andersen',
  })
  lastName: string;

  @ApiProperty({
    description: 'Patient date of birth.',
    example: '1990-04-12',
    format: 'date',
  })
  dateOfBirth: string;

  @ApiPropertyOptional({
    description: 'Patient contact email.',
    example: 'alice@example.com',
    format: 'email',
  })
  email?: string;
}

export class PatientPageDto {
  @ApiProperty({
    description: 'Patients visible to the authenticated account.',
    type: [PatientDto],
  })
  data: PatientDto[];

  @ApiProperty({
    description: 'Current one-based page number.',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Requested page size.',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of visible patients.',
    example: 2,
  })
  total: number;
}

export class DeletePatientResponseDto {
  @ApiProperty({
    description: 'Confirms that the patient was deleted.',
    example: true,
  })
  ok: true;
}
