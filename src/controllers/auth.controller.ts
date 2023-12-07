import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { RequestServer } from "../interfaces/Request";
import { ErrorFormat } from "../interfaces/Error";
import { Setting, User, UserToken } from "../models/Entities";
import { SETTING_COLLECTION, USER_COLLECTION } from "../models/Collections";

import { validationResult } from "express-validator";
import { generateUTCToLimaDate } from "../helpers/generators";
import { comparePassword, encryptPassword } from "../helpers/passwords";
import {
  templateEmailUserRecoveryAccount,
  templateEmailUserVerifyAccount,
  templateEmailUserRecoveryPassword,
  templateEmailUserChangePassword,
  sendMail,
  templateEmailUserWelcome,
} from "../emails";

const login = async (request: Request, res: Response) => {
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
    const { email = "", password = "" } = req.body;
    const userFound: User | null = await req.firebase.getOneDocument(
      USER_COLLECTION,
      [["email", "==", email?.toLowerCase()]]
    );

    // si no se encuentra dentro de los usuarios
    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Correo electrónico y/o contraseña incorrecta"],
      });
    }

    const matchPassword = await comparePassword(
      password,
      userFound.password || ""
    );

    if (!matchPassword) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Correo electrónico y/o contraseña incorrecta"],
      });
    }

    if (userFound.verified === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_VERIFIED",
        errors: ["Cuenta aún no verificada, por favor valide su cuenta"],
      });
    }

    if (userFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_ENABLED",
        errors: ["El usuario está deshabilitado"],
      });
    }

    const accessToken = jwt.sign({ id: userFound.id }, config.JWT_USER_SECRET, {
      expiresIn: "365d", //1 año
    });

    const refreshToken = jwt.sign(
      { id: userFound.id },
      config.JWT_USER_REFRESH_SECRET,
      {
        expiresIn: "365d", //1 año
      }
    );

    const { id, ...rest } = userFound;

    let tokens: UserToken[] = [];
    if (userFound.tokens && userFound.tokens.length > 0) {
      userFound.tokens.forEach((token) =>
        tokens.push({
          access_token: token.access_token,
          refresh_token: token.refresh_token,
        })
      );
    }

    // actualizamos el usuario con sus nuevas credenciales
    await req.firebase.updateDocumentById(USER_COLLECTION, id || "", {
      ...rest,
      tokens: [
        ...tokens,
        { access_token: accessToken, refresh_token: refreshToken },
      ],
      last_login: generateUTCToLimaDate(),
      updated_date: generateUTCToLimaDate(),
    });

    // buscamos el usuario por el id
    let newUser = await req.firebase.getDocumentById(
      USER_COLLECTION,
      userFound.id || ""
    );

    newUser.created_date = new Date(newUser.created_date?.seconds * 1000);

    if (newUser.document_type) {
      newUser.document_type = await req.firebase.getObjectByReference(
        newUser.document_type
      );

      newUser.document_type = req.firebase.showValuesDocument(
        newUser.document_type,
        ["name", "id"]
      );
    }

    if (newUser.gender) {
      newUser.gender = await req.firebase.getObjectByReference(newUser.gender);
      newUser.gender = req.firebase.showValuesDocument(newUser.gender, [
        "name",
        "id",
      ]);
    }

    newUser = req.firebase.cleanValuesDocument(newUser, [
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
        user: newUser,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      errors: [],
    });
  } catch (error) {
    console.log("user login response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const createUser = async (request: Request, res: Response) => {
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
    const {
      first_name = "",
      last_name = "",
      second_last_name = "",
      email = "",
      password = "",
    } = req.body;

    const isExistUserByEmail = await req.firebase.getOneDocument(
      USER_COLLECTION,
      [["email", "==", email?.toLowerCase()]]
    );

    if (isExistUserByEmail) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_EXIST",
        errors: ["El usuario ya se encuentra registrado"],
      });
    }

    const settingFound: Setting | null = await req.firebase.getOneDocument(
      SETTING_COLLECTION,
      [["status", "==", 1]]
    );

    if (!settingFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "SETTING_NOT_FOUND",
        errors: ["No existe un archivo de configuración activo"],
      });
    }

    const hash = await encryptPassword(password);

    let enableVerify = 0;

    if (settingFound.user_double_opt_in === 1) {
      enableVerify = 1;
    }

    const result = await req.firebase.insertDocument(USER_COLLECTION, {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      second_last_name: second_last_name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      photo: "",
      status: 1,
      verified: enableVerify === 1 ? 0 : 1,
      token: "",
      tokens: [],
      created_date: generateUTCToLimaDate(),
    });

    const userFound = await req.firebase.getDocumentById(
      USER_COLLECTION,
      result.id
    );

    const token = jwt.sign(
      { id: result.id },
      config.JWT_USER_VALIDATION_SECRET,
      {
        expiresIn: "15min",
      }
    );

    const { id: userId, ...rest } = userFound;

    // si la cuenta requiere verificación actualizamos el usuario con su token de verificación
    if (enableVerify === 1) {
      await req.firebase.updateDocumentById(USER_COLLECTION, result.id, {
        ...rest,
        token,
      });
    }

    const link = `${config.HOST_ADMIN}/auth/verify/?token=${token}`;

    const template = templateEmailUserWelcome({
      email: email.toLowerCase().trim(),
      firstName: first_name.trim(),
      lastName: last_name.trim(),
      link,
      isValidationEnable: enableVerify === 1 ? true : false,
    });

    const resEmail = await sendMail(template, "user create-user");

    if (resEmail.status_code !== 200) {
      return res.status(resEmail.status_code).json({
        ...result,
      });
    }

    userFound.last_login = new Date(userFound.last_login?.seconds * 1000);
    userFound.created_date = new Date(userFound.created_date?.seconds * 1000);
    userFound.updated_date = new Date(userFound.updated_date?.seconds * 1000);

    const cleanUser = req.firebase.cleanValuesDocument(userFound, [
      "password",
      "token",
      "tokens",
    ]);

    return res.status(200).json({
      status_code: 200,
      data: {
        user: cleanUser,
      },
      message: "Usuario registrado éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("user create-user response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const renewToken = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const accessToken = req.headers["x-access-token"]?.toString() || "";
    const refreshToken = req.body?.refresh_token;

    const userFound: User | null = await req.firebase.getDocumentById(
      USER_COLLECTION,
      req.userId
    );

    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (!userFound.tokens) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const hasTokens = userFound.tokens.some(
      (token) =>
        token.access_token === accessToken &&
        token.refresh_token === refreshToken
    );

    if (!hasTokens) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    if (userFound.verified === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_VERIFIED",
        errors: ["Cuenta aún no verificada, por favor valide su cuenta"],
      });
    }

    if (userFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_ENABLED",
        errors: ["El usuario está deshabilitado"],
      });
    }

    const newAccessToken = jwt.sign(
      { id: userFound.id },
      config.JWT_USER_SECRET,
      {
        expiresIn: "365d",
      }
    );

    const newRefreshToken = jwt.sign(
      { id: userFound.id },
      config.JWT_USER_REFRESH_SECRET,
      {
        expiresIn: "365d",
      }
    );

    const { id = "", ...rest } = userFound;

    let tokens: UserToken[] = [];

    userFound?.tokens?.forEach((token) => {
      if (
        token.access_token === accessToken &&
        token.refresh_token === refreshToken
      ) {
        tokens.push({
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        });
      } else {
        tokens.push(token);
      }
    });

    await req.firebase.updateDocumentById(USER_COLLECTION, id, {
      ...rest,
      tokens,
      updated_date: generateUTCToLimaDate(),
    });

    // buscamos el usuario por el id
    let newUser = await req.firebase.getDocumentById(USER_COLLECTION, id || "");

    newUser.created_date = new Date(newUser.created_date?.seconds * 1000);

    if (newUser.document_type) {
      newUser.document_type = await req.firebase.getObjectByReference(
        newUser.document_type
      );

      newUser.document_type = req.firebase.showValuesDocument(
        newUser.document_type,
        ["name", "id"]
      );
    }

    if (newUser.gender) {
      newUser.gender = await req.firebase.getObjectByReference(newUser.gender);
      newUser.gender = req.firebase.showValuesDocument(newUser.gender, [
        "name",
        "id",
      ]);
    }

    newUser = req.firebase.cleanValuesDocument(newUser, [
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
        user: newUser,
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      },
      errors: [],
    });
  } catch (error) {
    console.log("user renew-token response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const verifyAccessToken = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    let userFound = await req.firebase.getDocumentById(
      USER_COLLECTION,
      req.userId
    );

    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (!userFound.tokens) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const hasTokens = userFound.tokens?.some(
      (token: UserToken) => token.access_token === accessToken
    );

    if (!hasTokens) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    if (userFound.verified === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_VERIFIED",
        errors: ["Cuenta aún no verificada, por favor valide su cuenta"],
      });
    }

    if (userFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_ENABLED",
        errors: ["El usuario está deshabilitado"],
      });
    }

    const { access_token, refresh_token } = userFound.tokens?.find(
      (token: UserToken) => token.access_token === accessToken
    );

    userFound.created_date = new Date(userFound.created_date?.seconds * 1000);

    if (userFound.document_type) {
      userFound.document_type = await req.firebase.getObjectByReference(
        userFound.document_type
      );

      userFound.document_type = req.firebase.showValuesDocument(
        userFound.document_type,
        ["name", "id"]
      );
    }

    if (userFound.gender) {
      userFound.gender = await req.firebase.getObjectByReference(
        userFound.gender
      );
      userFound.gender = req.firebase.showValuesDocument(userFound.gender, [
        "name",
        "id",
      ]);
    }

    userFound = req.firebase.cleanValuesDocument(userFound, [
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
        user: userFound,
        access_token: access_token,
        refresh_token: refresh_token,
      },
      errors: [],
    });
  } catch (error) {
    console.log("user verify-access-token response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const recoveryAccount = async (request: Request, res: Response) => {
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
    const { email = "" } = request.body;

    const userFound: User | null = await req.firebase.getOneDocument(
      USER_COLLECTION,
      [["email", "==", email?.toLowerCase()]]
    );
    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Correo electrónico no válido"],
      });
    }

    if (userFound.verified == 1) {
      return res.status(400).json({
        status_code: 400,
        error_code: "VERIFIED_USER_ACCOUNT",
        errors: ["El usuario ya se encuentra verificado"],
      });
    }

    const token = jwt.sign(
      { id: userFound.id },
      config.JWT_USER_VALIDATION_SECRET,
      {
        expiresIn: "15min",
      }
    );
    const link = `${config.HOST_CLIENT}/auth/verify/?token=${token}`;

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(USER_COLLECTION, id || "", {
      ...rest,
      token,
      updated_date: generateUTCToLimaDate(),
    });

    const template = templateEmailUserRecoveryAccount({
      email: userFound.email,
      firstName: userFound.first_name,
      lastName: userFound.last_name,
      link,
    });
    const result = await sendMail(template, "user recovery-account");
    if (result.status_code !== 200) {
      return res.status(result.status_code).json({
        ...result,
      });
    }
    return res.status(200).json({
      ...result,
      message:
        "Correo enviado éxitosamente, recuerde que el link expirará en 15 min.",
    });
  } catch (error) {
    console.log("user recovery-account response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const verifyAccount = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  const token = req.headers["x-access-token"]?.toString() || "";
  try {
    const userFound: User | null = await req.firebase.getOneDocument(
      USER_COLLECTION,
      [["token", "==", token]]
    );
    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (userFound.id !== req.userId) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    if (userFound.verified == 1) {
      return res.status(400).json({
        status_code: 400,
        error_code: "VERIFIED_USER_ACCOUNT",
        errors: ["El usuario ya se encuentra verificado"],
      });
    }

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(USER_COLLECTION, id, {
      ...rest,
      token: "",
      verified: 1,
      updated_date: generateUTCToLimaDate(),
    });

    const link = `${config.HOST_ADMIN}/auth/login`;

    const template = templateEmailUserVerifyAccount({
      email: userFound.email,
      firstName: userFound.first_name,
      lastName: userFound.last_name,
      link,
    });

    await sendMail(template, "user verify-account");

    return res.status(200).json({
      status_code: 200,
      message: "La cuenta fue verificada",
      errors: [],
    });
  } catch (error) {
    console.log("user verify-account response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const recoveryPassword = async (request: Request, res: Response) => {
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
    const { email = "" } = request.body;

    const userFound: User | null = await req.firebase.getOneDocument(
      USER_COLLECTION,
      [["email", "==", email?.toLowerCase()]]
    );
    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Correo electrónico no válido"],
      });
    }
    const token = jwt.sign(
      { id: userFound.id },
      config.JWT_USER_VALIDATION_SECRET,
      {
        expiresIn: "15min",
      }
    );
    const link = `${config.HOST_CLIENT}/auth/restore/?token=${token}`;

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(USER_COLLECTION, id || "", {
      ...rest,
      token,
      updated_date: generateUTCToLimaDate(),
    });

    const template = templateEmailUserRecoveryPassword({
      email: userFound.email,
      firstName: userFound.first_name,
      lastName: userFound.last_name,
      link,
    });
    const result = await sendMail(template, "user recovery-password");
    if (result.status_code !== 200) {
      return res.status(result.status_code).json({
        ...result,
      });
    }
    return res.status(200).json({
      ...result,
      message:
        "Correo enviado éxitosamente, recuerde que el link expirará en 15 min.",
    });
  } catch (error) {
    console.log("user recovery-password response - error", error);
    return res
      .status(500)
      .json({ status: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const verifyPassword = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  const token = req.headers["x-access-token"]?.toString() || "";
  try {
    const userFound: User | null = await req.firebase.getOneDocument(
      USER_COLLECTION,
      [["token", "==", token]]
    );
    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (userFound.id !== req.userId) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }
    return res.status(200).json({
      status_code: 200,
      message: "Token de recuperación válido",
      errors: [],
    });
  } catch (error) {
    console.log("user verify-password response - error", error);
    return res
      .status(500)
      .json({ status: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const changePassword = async (request: Request, res: Response) => {
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
    const token = request.headers["x-access-token"]?.toString() || "";

    const { new_password = undefined } = req.body;

    const userFound: User | null = await req.firebase.getOneDocument(
      USER_COLLECTION,
      [["token", "==", token]]
    );
    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (userFound.id !== req.userId) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const hash = await encryptPassword(new_password);

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(USER_COLLECTION, id, {
      ...rest,
      token: "",
      password: hash,
      updated_date: generateUTCToLimaDate(),
    });

    // const link = `${config.HOST_CLIENT}/auth/login`;

    const template = templateEmailUserChangePassword({
      email: userFound.email,
      firstName: userFound.first_name,
      lastName: userFound.last_name,
      // link,
    });

    await sendMail(template, "user change-password");

    return res.status(200).json({
      status_code: 200,
      message: "contraseña actualizada",
      errors: [],
    });
  } catch (error) {
    console.log("user change-password response - error", error);
    return res
      .status(500)
      .json({ status: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const logoutAllSessionsExceptCurrentOne = async (
  request: Request,
  res: Response
) => {
  const req = request as RequestServer;

  try {
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    let userFound = await req.firebase.getDocumentById(
      USER_COLLECTION,
      req.userId
    );

    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (!userFound.tokens || userFound.tokens?.length === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const hasAccessToken = userFound?.tokens?.some(
      (token: UserToken) => token.access_token === accessToken
    );

    if (!hasAccessToken) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const tokens = userFound.tokens.filter(
      (token: UserToken) => token.access_token === accessToken
    );

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(USER_COLLECTION, id, {
      ...rest,
      tokens,
    });

    return res.status(200).json({
      status_code: 200,
      message: "Todas las sesiones fueron cerradas excepto la actual",
      errors: [],
    });
  } catch (error) {
    console.log(
      "user logout-all-sessions-except-current-one response - error",
      error
    );
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const logoutAllSessions = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    let userFound = await req.firebase.getDocumentById(
      USER_COLLECTION,
      req.userId
    );

    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (!userFound.tokens || userFound.tokens?.length === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const hasAccessToken = userFound?.tokens?.some(
      (token: UserToken) => token.access_token === accessToken
    );

    if (!hasAccessToken) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(USER_COLLECTION, id, {
      ...rest,
      tokens: [],
    });

    return res.status(200).json({
      status_code: 200,
      message: "Todas las sesiones fueron cerradas",
      errors: [],
    });
  } catch (error) {
    console.log("user logout-all-sessions response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const logoutCurrentSession = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    let userFound = await req.firebase.getDocumentById(
      USER_COLLECTION,
      req.userId
    );

    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (!userFound.tokens || userFound.tokens?.length === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const hasAccessToken = userFound?.tokens?.some(
      (token: UserToken) => token.access_token === accessToken
    );

    if (!hasAccessToken) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const tokens = userFound.tokens.filter(
      (token: UserToken) => token.access_token !== accessToken
    );

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(USER_COLLECTION, id, {
      ...rest,
      tokens,
    });

    return res.status(200).json({
      status_code: 200,
      message: "Sesión cerrada",
      errors: [],
    });
  } catch (error) {
    console.log("user logout-current-session response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export {
  login,
  createUser,
  renewToken,
  verifyAccessToken,
  recoveryAccount,
  verifyAccount,
  recoveryPassword,
  verifyPassword,
  changePassword,
  logoutAllSessions,
  logoutAllSessionsExceptCurrentOne,
  logoutCurrentSession,
};
