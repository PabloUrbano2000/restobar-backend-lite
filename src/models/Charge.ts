import { Status } from "./Generic";

export type Charge = {
  id: string;
  name: string;
  description: string;
  min_salary: number;
  max_salary: number;
  status: Status;
  created_date: Date | string;
  updated_date: Date | string;
};

export const CHARGE_COLLECTION = "charges";
