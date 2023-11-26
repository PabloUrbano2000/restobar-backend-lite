import { Status } from "./Generic";

export enum OPERATION_TYPE {
  IDENTITY = "IDENTITY",
  TRANSACTION = "TRANSACTION",
}

export type DocumentTypeDB = {
  id?: string;
  name?: string;
  code?: string;
  sequential?: number;
  length?: number;
  operation?: OPERATION_TYPE;
  status?: Status;
  regex?: string;
  created_date?: Date | string;
  updated_date?: Date | string;
};

export const DOCUMENT_TYPE_COLLECTION = "document_types";
