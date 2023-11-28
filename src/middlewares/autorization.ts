import { NextFunction, Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";
import { SYSTEM_USER_COLLECTION } from "../models/Collections";
import { Module } from "../models/Module";

export const verifyPermissions = (moduleName: string) => {
  return async (request: Request, res: Response, next: NextFunction) => {
    const req = request as RequestServer;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token no válido"],
      });
    }

    try {
      const userFound = await req.firebase.getDocumentById(
        SYSTEM_USER_COLLECTION,
        userId
      );

      if (
        !userFound ||
        userFound.verified === 0 ||
        userFound.status === 0 ||
        !userFound.role
      ) {
        return res.status(401).json({
          status_code: 401,
          error_code: "ACCESS_DENIED",
          errors: ["Acceso denegado"],
        });
      }

      userFound.role = await req.firebase.getObjectByReference(userFound.role);

      if (
        !userFound?.role?.permissions ||
        userFound?.role?.permissions.length === 0
      ) {
        return res.status(401).json({
          status_code: 401,
          error_code: "ACCESS_DENIED",
          errors: ["Acceso denegado"],
        });
      }

      userFound.role.permissions = await req.firebase.getObjectsByReference(
        userFound?.role?.permissions
      );

      const { permissions = [] } = userFound.role || {};
      const hasModules = permissions.some(
        (per: Module) => per.name === moduleName
      );
      if (!hasModules) {
        return res.status(401).json({
          status_code: 401,
          error_code: "ACCESS_DENIED",
          errors: ["Acceso denegado"],
        });
      }
      next();
    } catch (error) {
      console.log(error);
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token no válido"],
      });
    }
  };
};
