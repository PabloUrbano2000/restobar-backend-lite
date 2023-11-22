import { Status, Verified } from "./Generic";
import { Role } from "./Role";

export type SystemUser = {
  id: string;
  email: string;
  password: string;
  username: string;
  photo: string;
  status: Status;
  verified: Verified;
  role: Role;
  created_date: Date | string;
  updated_date: Date | string;
};

export const SYSTEM_USER_COLLECTION = "system_users";
