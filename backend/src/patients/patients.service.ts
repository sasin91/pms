import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Patient as PrismaPatient } from '@prisma/client';
import { ERROR_MESSAGES } from '../common/error-messages';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePatientDto } from './dto/create-patient.dto';
import type { ReplacePatientDto } from './dto/replace-patient.dto';
import type { Patient, PatientPage } from './patient.entity';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    page: number,
    limit: number,
    patientId?: string,
  ): Promise<PatientPage> {
    const where = patientId ? { id: patientId } : {};
    const [patients, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients.map((patient) => this.toPatient(patient)),
      page,
      limit,
      total,
    };
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({ where: { id } });

    if (!patient) {
      throw new NotFoundException(ERROR_MESSAGES.patient.notFound(id));
    }

    return this.toPatient(patient);
  }

  async create(input: CreatePatientDto): Promise<Patient> {
    this.validateCreate(input);

    const patient = await this.prisma.patient.create({
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        dateOfBirth: input.dateOfBirth,
        email: input.email?.trim(),
      },
    });

    return this.toPatient(patient);
  }

  async replace(id: string, input: ReplacePatientDto): Promise<Patient> {
    await this.findOne(id);
    this.validateCreate(input);

    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        dateOfBirth: input.dateOfBirth,
        email: input.email?.trim(),
      },
    });

    return this.toPatient(patient);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.patient.delete({ where: { id } });
  }

  private toPatient(patient: PrismaPatient): Patient {
    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      ...(patient.email ? { email: patient.email } : {}),
    };
  }

  private validateCreate(input: CreatePatientDto): void {
    if (
      !input ||
      !this.isNonEmptyString(input.firstName) ||
      !this.isNonEmptyString(input.lastName) ||
      !this.isDate(input.dateOfBirth)
    ) {
      throw new BadRequestException(ERROR_MESSAGES.patient.requiredFields);
    }

    if (input.email !== undefined && !this.isNonEmptyString(input.email)) {
      throw new BadRequestException(ERROR_MESSAGES.patient.invalidEmail);
    }
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isDate(value: unknown): value is string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    );
  }
}
