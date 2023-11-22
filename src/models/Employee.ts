import { Charge } from "./Charge";
import { DocumentTypeDB } from "./DocumentType";
import { Gender } from "./Gender";
import { SystemUser } from "./SystemUser";

export type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  second_last_name: string;
  cellphone_number: string;
  birthdate: Date | string;
  landline_phone_number: string;
  email_company: string;
  address: string;
  user: SystemUser | null;
  document_type: DocumentTypeDB;
  document_number: string;
  manager: Employee | null;
  charge: Charge;
  salary: number;
  gender: Gender;
  date_of_hire: Date | string;
  dismissal_date: Date | string;
  created_date: Date | string;
  updated_date: Date | string;
};

export const EMPLOYEE_COLLECTION = "employees";
