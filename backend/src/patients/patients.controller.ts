import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { ERROR_MESSAGES } from '../common/error-messages';
import { Role } from '../users/role.enum';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import {
  DeletePatientResponseDto,
  PatientDto,
  PatientPageDto,
} from './dto/patient.dto';
import { ReplacePatientDto } from './dto/replace-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('Patients')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'A valid bearer token is required.',
  type: ErrorResponseDto,
})
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @ApiOperation({
    summary: 'List visible patients',
    description:
      'Admins can list every patient. Users can only list their associated patient.',
  })
  @ApiOkResponse({
    description: 'A page of patients visible to the authenticated account.',
    type: PatientPageDto,
  })
  @ApiBadRequestResponse({
    description: 'List parameters are invalid.',
    type: ErrorResponseDto,
  })
  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PatientPageDto> {
    if (request.user.role === Role.User && !request.user.patientId) {
      return {
        data: [],
        page: pagination.page,
        limit: pagination.limit,
        total: 0,
      };
    }

    return this.patientsService.findPage(
      pagination.page,
      pagination.limit,
      request.user.patientId,
      pagination.search,
      pagination.sortBy,
      pagination.sortOrder,
    );
  }

  @ApiOperation({
    summary: 'Get one patient',
    description:
      'Admins can read any patient. Users can only read their associated patient.',
  })
  @ApiOkResponse({ description: 'The requested patient.', type: PatientDto })
  @ApiForbiddenResponse({
    description: 'The user is not associated with this patient.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The patient does not exist.',
    type: ErrorResponseDto,
  })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<PatientDto> {
    this.assertCanReadPatient(request, id);
    return this.patientsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a patient' })
  @ApiCreatedResponse({
    description: 'The patient was created.',
    type: PatientDto,
  })
  @ApiBadRequestResponse({
    description: 'The patient payload is invalid.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only administrators can create patients.',
    type: ErrorResponseDto,
  })
  @Post()
  @Roles(Role.Admin)
  create(@Body() patient: CreatePatientDto): Promise<PatientDto> {
    return this.patientsService.create(patient);
  }

  @ApiOperation({ summary: 'Replace a patient' })
  @ApiOkResponse({
    description: 'The patient was replaced.',
    type: PatientDto,
  })
  @ApiBadRequestResponse({
    description: 'The replacement payload is invalid.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only administrators can replace patients.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The patient does not exist.',
    type: ErrorResponseDto,
  })
  @Put(':id')
  @Roles(Role.Admin)
  replace(
    @Param('id') id: string,
    @Body() patient: ReplacePatientDto,
  ): Promise<PatientDto> {
    return this.patientsService.replace(id, patient);
  }

  @ApiOperation({ summary: 'Delete a patient' })
  @ApiOkResponse({
    description: 'The patient was deleted.',
    type: DeletePatientResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only administrators can delete patients.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The patient does not exist.',
    type: ErrorResponseDto,
  })
  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string): Promise<DeletePatientResponseDto> {
    await this.patientsService.remove(id);
    return { ok: true };
  }

  private assertCanReadPatient(
    request: AuthenticatedRequest,
    patientId: string,
  ): void {
    if (
      request.user.role !== Role.Admin &&
      request.user.patientId !== patientId
    ) {
      throw new ForbiddenException(ERROR_MESSAGES.patient.readForbidden);
    }
  }
}
