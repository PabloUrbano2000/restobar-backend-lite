import { Status } from "./Generic";

export type Module = {
  id?: string;
  name?: string;
  status?: Status;
};

export const MODULE_COLLECTION = "modules";
