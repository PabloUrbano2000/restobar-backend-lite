import { Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";
import {
  DOCUMENT_TYPE_COLLECTION,
  GENDER_COLLECTION,
  SYSTEM_USER_COLLECTION,
  USER_COLLECTION,
} from "../models/Collections";
import { UserToken } from "../models/User";
import { generateUTCToLimaDate } from "../helpers/generators";
import { ErrorFormat } from "../interfaces/Error";
import { validationResult } from "express-validator";
import { comparePassword, encryptPassword } from "../helpers/passwords";
import { OPERATION_TYPE } from "../models/DocumentType";

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
        error_code: "PROFILE_NOT_FOUND",
        errors: ["Perfil no existente"],
      });
    }

    if (profileFound.access_token !== accessToken) {
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

const updateSystemUserProfile = async (request: Request, res: Response) => {
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
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    const {
      first_name = undefined,
      last_name = undefined,
      second_last_name = undefined,
    } = req.body;

    if (
      first_name === undefined &&
      last_name === undefined &&
      second_last_name === undefined
    ) {
      return res.status(400).json({
        status_code: 400,
        error_code: "INVALID_BODY_FIELDS",
        errors: ["No se envió información para actualizar"],
      });
    }

    const profileFound = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      req.userId
    );

    if (!profileFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PROFILE_NOT_FOUND",
        errors: ["Perfil no existente"],
      });
    }

    if (profileFound.access_token !== accessToken) {
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

    let auxData: any = {};

    if (first_name) {
      auxData.first_name = first_name;
    }

    if (last_name) {
      auxData.last_name = last_name;
    }

    if (second_last_name) {
      auxData.second_last_name = second_last_name;
    }

    const { id: profileId, ...rest } = profileFound;

    await req.firebase.updateDocumentById(SYSTEM_USER_COLLECTION, profileId, {
      ...rest,
      ...auxData,
      updated_date: generateUTCToLimaDate(),
    });

    let newProfile = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      profileId
    );

    if (newProfile.role) {
      newProfile.role = await req.firebase.getObjectByReference(
        newProfile.role
      );
      newProfile.role = req.firebase.cleanValuesDocument(newProfile.role, [
        "created_date",
        "updated_date",
      ]);
      if ("permissions" in newProfile.role) {
        newProfile.role.permissions = await req.firebase.getObjectsByReference(
          newProfile.role.permissions
        );
      }
    }

    newProfile.created_date = new Date(newProfile.created_date?.seconds * 1000);

    newProfile = req.firebase.cleanValuesDocument(newProfile, [
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
      message: "El perfil del usuario fue actualizado",
      errors: [],
    });
  } catch (error) {
    console.log("profile update-system-user-profile response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const changePasswordSystemUser = async (request: Request, res: Response) => {
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
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    const { current_password = undefined, new_password = undefined } = req.body;

    const profileFound = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      req.userId
    );

    if (!profileFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PROFILE_NOT_FOUND",
        errors: ["Perfil no existente"],
      });
    }

    if (profileFound.access_token !== accessToken) {
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

    const matchPassword = await comparePassword(
      current_password,
      profileFound.password
    );

    if (!matchPassword) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PASSWORD_IS_INVALID",
        errors: ["La contraseña es incorrecta"],
      });
    }

    const hash = await encryptPassword(new_password);

    const { id: profileId, ...rest } = profileFound;

    await req.firebase.updateDocumentById(SYSTEM_USER_COLLECTION, profileId, {
      ...rest,
      password: hash,
      updated_date: generateUTCToLimaDate(),
    });

    let newProfile = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      profileId
    );

    if (newProfile.role) {
      newProfile.role = await req.firebase.getObjectByReference(
        newProfile.role
      );
      newProfile.role = req.firebase.cleanValuesDocument(newProfile.role, [
        "created_date",
        "updated_date",
      ]);
      if ("permissions" in newProfile.role) {
        newProfile.role.permissions = await req.firebase.getObjectsByReference(
          newProfile.role.permissions
        );
      }
    }

    newProfile.created_date = new Date(newProfile.created_date?.seconds * 1000);

    newProfile = req.firebase.cleanValuesDocument(newProfile, [
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
      message: "La contraseña fue actualizada éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("profile change-password-system-user response - error", error);
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

    if (profileFound.document_type) {
      profileFound.document_type = await req.firebase.getObjectByReference(
        profileFound.document_type
      );

      profileFound.document_type = req.firebase.showValuesDocument(
        profileFound.document_type,
        ["name", "id"]
      );
    }

    if (profileFound.gender) {
      profileFound.gender = await req.firebase.getObjectByReference(
        profileFound.gender
      );
      profileFound.gender = req.firebase.showValuesDocument(
        profileFound.gender,
        ["name", "id"]
      );
    }

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

const updateUserProfile = async (request: Request, res: Response) => {
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
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    const {
      first_name = undefined,
      last_name = undefined,
      second_last_name = undefined,
      document_type = undefined,
      document_number = undefined,
      cellphone_number = undefined,
      address = undefined,
      gender = undefined,
    } = req.body;

    if (
      first_name === undefined &&
      last_name === undefined &&
      second_last_name === undefined &&
      document_type === undefined &&
      document_number === undefined &&
      cellphone_number === undefined &&
      address === undefined &&
      gender === undefined
    ) {
      return res.status(400).json({
        status_code: 400,
        error_code: "INVALID_BODY_FIELDS",
        errors: ["No se envió información para actualizar"],
      });
    }

    const profileFound = await req.firebase.getDocumentById(
      USER_COLLECTION,
      req.userId
    );

    if (!profileFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PROFILE_NOT_FOUND",
        errors: ["Perfil no existente"],
      });
    }

    if (!profileFound.tokens) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const hasTokens = profileFound.tokens?.some(
      (token: UserToken) => token.access_token === accessToken
    );

    if (!hasTokens) {
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

    let auxData: any = {};

    if (first_name) {
      auxData.first_name = first_name;
    }

    if (last_name) {
      auxData.last_name = last_name;
    }

    if (second_last_name) {
      auxData.second_last_name = second_last_name;
    }

    if (document_type && document_number) {
      const documentFound = await req.firebase.getDocumentById(
        DOCUMENT_TYPE_COLLECTION,
        document_type
      );

      auxData.document_type = req.firebase.instanceReferenceById(
        DOCUMENT_TYPE_COLLECTION,
        documentFound.id
      );
      auxData.document_number = document_number;
    }

    if (cellphone_number) {
      auxData.cellphone_number = cellphone_number;
    }
    if (address) {
      auxData.address = address;
    }

    if (gender) {
      const genderFound = await req.firebase.getDocumentById(
        GENDER_COLLECTION,
        gender
      );

      if (!genderFound) {
        return res.status(401).json({
          status_code: 401,
          error_code: "GENDER_NOT_FOUND",
          errors: ["Género no existente"],
        });
      }

      auxData.gender = req.firebase.instanceReferenceById(
        GENDER_COLLECTION,
        genderFound.id
      );
    }

    const { id: profileId, ...rest } = profileFound;

    await req.firebase.updateDocumentById(USER_COLLECTION, profileId, {
      ...rest,
      ...auxData,
      updated_date: generateUTCToLimaDate(),
    });

    let newProfile = await req.firebase.getDocumentById(
      USER_COLLECTION,
      profileId
    );

    if (newProfile.document_type) {
      newProfile.document_type = await req.firebase.getObjectByReference(
        newProfile.document_type
      );

      newProfile.document_type = req.firebase.showValuesDocument(
        newProfile.document_type,
        ["name", "id"]
      );
    }

    if (newProfile.gender) {
      newProfile.gender = await req.firebase.getObjectByReference(
        newProfile.gender
      );
      newProfile.gender = req.firebase.showValuesDocument(newProfile.gender, [
        "name",
        "id",
      ]);
    }

    newProfile.created_date = new Date(newProfile.created_date?.seconds * 1000);

    newProfile = req.firebase.cleanValuesDocument(newProfile, [
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
      message: "El perfil del usuario fue actualizado",
      errors: [],
    });
  } catch (error) {
    console.log("profile update-system-user-profile response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const changePasswordUser = async (request: Request, res: Response) => {
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
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    const { current_password = undefined, new_password = undefined } = req.body;

    const profileFound = await req.firebase.getDocumentById(
      USER_COLLECTION,
      req.userId
    );

    if (!profileFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PROFILE_NOT_FOUND",
        errors: ["Perfil no existente"],
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

    const matchPassword = await comparePassword(
      current_password,
      profileFound.password
    );

    if (!matchPassword) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PASSWORD_IS_INVALID",
        errors: ["La contraseña es incorrecta"],
      });
    }

    const hash = await encryptPassword(new_password);

    const { id: profileId, ...rest } = profileFound;

    await req.firebase.updateDocumentById(USER_COLLECTION, profileId, {
      ...rest,
      password: hash,
      updated_date: generateUTCToLimaDate(),
    });

    let newProfile = await req.firebase.getDocumentById(
      USER_COLLECTION,
      profileId
    );

    newProfile.created_date = new Date(newProfile.created_date?.seconds * 1000);

    if (newProfile.document_type) {
      newProfile.document_type = await req.firebase.getObjectByReference(
        newProfile.document_type
      );

      newProfile.document_type = req.firebase.showValuesDocument(
        newProfile.document_type,
        ["name", "id"]
      );
    }

    if (newProfile.gender) {
      newProfile.gender = await req.firebase.getObjectByReference(
        newProfile.gender
      );
      newProfile.gender = req.firebase.showValuesDocument(newProfile.gender, [
        "name",
        "id",
      ]);
    }

    newProfile = req.firebase.cleanValuesDocument(newProfile, [
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
      message: "La contraseña fue actualizada éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("profile change-password-user response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export {
  getSystemUserProfile,
  updateSystemUserProfile,
  changePasswordSystemUser,
  getClientProfile,
  updateUserProfile,
  changePasswordUser,
};
