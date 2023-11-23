import { DocumentTypeDB } from "./DocumentType";
import { Gender } from "./Gender";
import { Status, Verified } from "./Generic";

export type User = {
  id?: string;
  first_name?: string;
  last_name?: string;
  second_last_name?: string;
  document_type?: DocumentTypeDB | null;
  document_number?: string;
  cellphone_number?: string;
  address?: string;
  gender?: Gender | null;
  email?: string;
  password?: string;
  verified?: Verified;
  photo?: string;
  token?: string;
  status?: Status;
  tokens?: UserToken[];
  created_date?: Date | string;
  updated_date?: Date | string;
};

export type UserToken = {
  id: string;
  user: User;
  access_token: string;
  refresh_token: string;
};

export const USER_COLLECTION = "users";
export const USER_TOKEN_COLLECTION = "user_tokens";
