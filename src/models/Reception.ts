import { Available, Status } from "./Generic";

export type Reception = {
  id?: string;
  number_table?: string;
  code?: string;
  available?: Available;
  requires_attention?: number;
  status?: Status;
  created_date?: Date | string;
  updated_date?: Date | string;
};

export const RECEPTION_COLLECTION = "receptions";
