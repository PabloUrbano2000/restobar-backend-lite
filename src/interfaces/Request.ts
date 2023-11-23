import { Request } from "express";
import { Firebase } from "../firebase/index";

export interface RequestServer extends Request {
  firebase: Firebase;
}
