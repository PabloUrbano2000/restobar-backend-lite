import { Status } from "./Generic";

export type Category = {
  id?: string;
  name?: string;
  description?: string;
  status?: Status;
};

export const CATEGORY_COLLECTION = "categories";