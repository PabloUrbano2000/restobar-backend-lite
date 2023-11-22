import { Status } from "./Generic";
import { SystemUser } from "./SystemUser";

export type Setting = {
  id: string;
  opening_time: string;
  closing_time: string;
  system_manual: string;
  tax: number;
  ruc: string;
  business_name: string;
  address: string;
  created_date: Date | string;
  status: Status;
  user_creator: SystemUser | null;
  last_publication_date: Date | string;
  last_user_publisher: SystemUser;
};

export const SETTING_COLLECTION = "settings";
