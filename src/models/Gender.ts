import { Status } from "./Generic";

export type Gender = {
  id?: string;
  name?: string;
  status?: Status;
};

export const GENDER_COLLECTION = "genders";
