import { Request } from "express";
import { Firebase } from "../firebase/index";
import { SystemUser, User } from "../models/Entities";

export interface RequestServer extends Request {
  firebase: Firebase;
  user: SystemUser | User;
  userId: string;
}
