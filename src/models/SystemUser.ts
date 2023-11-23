import { Status, Verified } from "./Generic";
import bcrypt from "bcryptjs";
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

export const encryptPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  receivedPassword: string
) => {
  return await bcrypt.compare(password, receivedPassword);
};

export const SYSTEM_USER_COLLECTION = "system_users";
