export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
}

export interface PatientPage {
  data: Patient[];
  page: number;
  limit: number;
  total: number;
}
