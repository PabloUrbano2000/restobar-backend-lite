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

export const verifySysUserAccessToken = async (
  request: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = request.headers["x-access-token"]?.toString() || "";
  if (!accessToken) {
    return res.status(401).json({
      status_code: 401,
      error_code: "INVALID_TOKEN",
      errors: ["Token no válido"],
    });
  }

  try {
    const { id }: any = jwt.verify(accessToken, config.JWT_SYS_SECRET);
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

export const verifySysUserRefreshToken = async (
  request: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = request.body.refresh_token || "";
  if (!refreshToken) {
    return res.status(401).json({
      status_code: 401,
      error_code: "INVALID_REFRESH_TOKEN",
      errors: ["Token no válido"],
    });
  }

  try {
    const { id }: any = jwt.verify(refreshToken, config.JWT_SYS_REFRESH_SECRET);
    const req = request as RequestServer;
    req.userId = id;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      status_code: 401,
      error_code: "INVALID_REFRESH_TOKEN",
      errors: ["Token no válido"],
    });
  }
};

export const verifyUserAccessToken = async (
  request: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = request.headers["x-access-token"]?.toString() || "";
  if (!accessToken) {
    return res.status(401).json({
      status_code: 401,
      error_code: "INVALID_TOKEN",
      errors: ["Token no válido"],
    });
  }

  try {
    const { id }: any = jwt.verify(accessToken, config.JWT_USER_SECRET);
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

export const verifyUserRefreshToken = async (
  request: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = request.body.refresh_token || "";
  if (!refreshToken) {
    return res.status(401).json({
      status_code: 401,
      error_code: "INVALID_REFRESH_TOKEN",
      errors: ["Token no válido"],
    });
  }

  try {
    const { id }: any = jwt.verify(
      refreshToken,
      config.JWT_USER_REFRESH_SECRET
    );
    const req = request as RequestServer;
    req.userId = id;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      status_code: 401,
      error_code: "INVALID_REFRESH_TOKEN",
      errors: ["Token no válido"],
    });
  }
};
