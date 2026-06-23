import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code.',
    example: 401,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Human-readable error description.',
    example: 'Authentication is required',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP error name.',
    example: 'Unauthorized',
  })
  error: string;
}
