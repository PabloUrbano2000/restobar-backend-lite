import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { RequestServer } from "../interfaces/Request";

export const verifySysUserValidToken = async (
  request: Request,
  res: Response,
  next: NextFunction
) => {
  const validationToken = request.headers["x-access-token"]?.toString() || "";
  if (!validationToken) {
    return res.status(401).json({
      status_code: 401,
      error_code: "INVALID_TOKEN",
      errors: ["Token no válido"],
    });
  }

  try {
    const { id }: any = jwt.verify(
      validationToken,
      config.JWT_SYS_VALIDATION_SECRET
    );
    const req = request as RequestServer;
    req.userId = id;
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
