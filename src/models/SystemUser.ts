import { Status, Verified } from "./Generic";
import { Role } from "./Role";

export type SystemUser = {
  id?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  photo?: string;
  status?: Status;
  verified?: Verified;
  role?: Role;
  user_creator?: SystemUser | null;
  account_suspension_day?: Date | string;
  access_token?: string;
  refresh_token?: string;
  validation_token?: string;
  created_date?: Date | string;
  updated_date?: Date | string;
};

export const SYSTEM_USER_COLLECTION = "system_users";
