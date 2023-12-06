import { Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";
import { ErrorFormat } from "../interfaces/Error";
import { validationResult } from "express-validator";
import { SYSTEM_USER_COLLECTION } from "../models/SystemUser";

const getSystemUserProfile = async (request: Request, res: Response) => {
  const req = request as RequestServer;
  let errors: ErrorFormat[] = [];
  const resultValidator = validationResult(req);

  if (!resultValidator.isEmpty()) {
    errors = resultValidator.array().map((data) => data.msg);

    return res.status(400).json({
      status_code: 400,
      error_code: "INVALID_BODY_FIELDS",
      errors,
    });
  }

  try {
    const { id = "" } = req.body;

    const profileFound = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      id
    );

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


const getClientProfile = async(request: Request, res: Response)=> {

    

}

export { getSystemUserProfile };
