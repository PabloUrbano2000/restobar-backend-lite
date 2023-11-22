import { Module } from "./Module";

export type RoleAccess = {
  id: string;
  role: Role;
  module: Module;
};

export type Role = {
  id: string;
  name: string;
  status: number;
  created_date: Date | string;
  updated_date: Date | string;
  permissions: RoleAccess[];
};

export const ROLE_COLLECTION = "roles";
export const ROLE_ACCESS_COLLECTION = "role_access";
