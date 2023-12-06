import { Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";
import { SYSTEM_USER_COLLECTION, USER_COLLECTION } from "../models/Collections";
import { UserToken } from "../models/User";

const getSystemUserProfile = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    const profileFound = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      req.userId
    );

    if (!profileFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (profileFound.access_token !== accessToken) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    if (!profileFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PROFILE_NOT_FOUND",
        errors: ["Perfil no fue encontrado"],
      });
    }

    if (profileFound.verified === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PROFILE_NOT_VERIFIED",
        errors: ["El perfil aún no está verificado"],
      });
    }

    if (profileFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PROFILE_NOT_ENABLED",
        errors: ["El perfil está deshabilitado"],
      });
    }

    if (profileFound.role) {
      profileFound.role = await req.firebase.getObjectByReference(
        profileFound.role
      );
      profileFound.role = req.firebase.cleanValuesDocument(profileFound.role, [
        "created_date",
        "updated_date",
      ]);
      if ("permissions" in profileFound.role) {
        profileFound.role.permissions =
          await req.firebase.getObjectsByReference(
            profileFound.role.permissions
          );
      }
    }

    profileFound.created_date = new Date(
      profileFound.created_date?.seconds * 1000
    );

    const newProfile = req.firebase.cleanValuesDocument(profileFound, [
      "account_suspension_day",
      "password",
      "access_token",
      "refresh_token",
      "validation_token",
      "updated_date",
      "last_login",
    ]);

    return res.status(200).json({
      status_code: 200,
      data: {
        profile: newProfile,
      },
      errors: [],
    });
  } catch (error) {
    console.log("profile get-system-user-profile response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getClientProfile = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    const profileFound = await req.firebase.getDocumentById(
      USER_COLLECTION,
      req.userId
    );

    if (!profileFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PROFILE_NOT_FOUND",
        errors: ["Perfil no fue encontrado"],
      });
    }

    if (!profileFound.tokens || profileFound.tokens?.length === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const hasAccessToken = profileFound?.tokens?.some(
      (token: UserToken) => token.access_token === accessToken
    );

    if (!hasAccessToken) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    if (profileFound.verified === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PROFILE_NOT_VERIFIED",
        errors: ["El perfil aún no está verificado"],
      });
    }

    if (profileFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PROFILE_NOT_ENABLED",
        errors: ["El perfil está deshabilitado"],
      });
    }

    profileFound.created_date = new Date(
      profileFound.created_date?.seconds * 1000
    );

    const newProfile = req.firebase.cleanValuesDocument(profileFound, [
      "last_login",
      "updated_date",
      "password",
      "status",
      "tokens",
      "token",
    ]);

    return res.status(200).json({
      status_code: 200,
      data: {
        profile: {
          ...newProfile,
          has_multi_sessions: !!(profileFound.tokens.length > 1),
        },
      },
      errors: [],
    });
  } catch (error) {
    console.log("profile get-user-profile response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export { getSystemUserProfile, getClientProfile };
