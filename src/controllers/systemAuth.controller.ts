import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { RequestServer } from "../interfaces/Request";
import { ErrorFormat } from "../interfaces/Error";
import { SYSTEM_USER_COLLECTION, SystemUser } from "../models/SystemUser";

import { validationResult } from "express-validator";
import { generateUTCToLimaDate } from "../helpers/generators";
import { comparePassword, encryptPassword } from "../helpers/passwords";
import {
  templateEmailSystemRecoveryAccount,
  templateEmailSystemVerifyAccount,
  templateEmailSystemRecoveryPassword,
  templateEmailSystemChangePassword,
  sendMail,
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
    const userFound: SystemUser | null = await req.firebase.getOneDocument(
      SYSTEM_USER_COLLECTION,
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

    const token = jwt.sign({ id: userFound.id }, config.JWT_SYS_SECRET, {
      expiresIn: 86400, //24 horas
    });

    const refreshToken = jwt.sign(
      { id: userFound.id },
      config.JWT_SYS_REFRESH_SECRET,
      {
        expiresIn: 86400, //24 horas
      }
    );

    const { id, ...rest } = userFound;

    // actualizamos el usuario con sus nuevas credenciales
    await req.firebase.updateDocumentById(
      SYSTEM_USER_COLLECTION,
      userFound.id || "",
      {
        ...rest,
        access_token: token,
        refresh_token: refreshToken,
        validation_token: "",
        last_login: generateUTCToLimaDate(),
        updated_date: generateUTCToLimaDate(),
      }
    );

    // buscamos el usuario por el id
    let newUser = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      userFound.id || ""
    );

    // obtener role del usuario
    if (newUser.role) {
      newUser.role = await req.firebase.getObjectByReference(newUser.role);
      newUser.role = req.firebase.cleanValuesDocument(newUser.role, [
        "created_date",
        "updated_date",
      ]);
      if ("permissions" in newUser.role) {
        newUser.role.permissions = await req.firebase.getObjectsByReference(
          newUser.role.permissions
        );
      }
    }

    newUser.last_login = new Date(newUser.last_login?.seconds * 1000);
    newUser.created_date = new Date(newUser.created_date?.seconds * 1000);
    newUser.updated_date = new Date(newUser.updated_date?.seconds * 1000);

    const userAccessToken = newUser.access_token.toString();
    const userRefreshToken = newUser.refresh_token.toString();

    newUser = req.firebase.cleanValuesDocument(newUser, [
      "account_suspension_day",
      "password",
      "access_token",
      "refresh_token",
      "validation_token",
    ]);

    return res.status(200).json({
      status_code: 200,
      data: {
        user: newUser,
        access_token: userAccessToken,
        refresh_token: userRefreshToken,
      },
      errors: [],
    });
  } catch (error) {
    console.log("system-user login response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const renewToken = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const accessToken = req.headers["x-access-token"]?.toString() || "";
    const refreshToken = req.body.refresh_token;

    const userFound = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      req.userId
    );

    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (
      userFound.access_token !== accessToken ||
      userFound.refresh_token !== refreshToken
    ) {
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
      config.JWT_SYS_SECRET,
      {
        expiresIn: 86400,
      }
    );

    const newRefreshToken = jwt.sign(
      { id: userFound.id },
      config.JWT_SYS_REFRESH_SECRET,
      {
        expiresIn: 86400,
      }
    );

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(SYSTEM_USER_COLLECTION, id, {
      ...rest,
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      validation_token: "",
      updated_date: generateUTCToLimaDate(),
    });

    // buscamos el usuario por el id
    let newUser = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      userFound.id || ""
    );

    // obtener role del usuario
    if (newUser.role) {
      newUser.role = await req.firebase.getObjectByReference(newUser.role);
      newUser.role = req.firebase.cleanValuesDocument(newUser.role, [
        "created_date",
        "updated_date",
      ]);
      if ("permissions" in newUser.role) {
        newUser.role.permissions = await req.firebase.getObjectsByReference(
          newUser.role.permissions
        );
      }
    }

    newUser.last_login = new Date(newUser.last_login?.seconds * 1000);
    newUser.created_date = new Date(newUser.created_date?.seconds * 1000);
    newUser.updated_date = new Date(newUser.updated_date?.seconds * 1000);

    const userAccessToken = newUser.access_token.toString();
    const userRefreshToken = newUser.refresh_token.toString();

    newUser = req.firebase.cleanValuesDocument(newUser, [
      "account_suspension_day",
      "password",
      "access_token",
      "refresh_token",
      "validation_token",
    ]);

    return res.status(200).json({
      status_code: 200,
      data: {
        user: newUser,
        access_token: userAccessToken,
        refresh_token: userRefreshToken,
      },
      errors: [],
    });
  } catch (error) {
    console.log("system-user renew-token response - error", error);
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
      SYSTEM_USER_COLLECTION,
      req.userId
    );

    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (userFound.access_token !== accessToken) {
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

    // obtener role del usuario
    if (userFound.role) {
      userFound.role = await req.firebase.getObjectByReference(userFound.role);
      userFound.role = req.firebase.cleanValuesDocument(userFound.role, [
        "created_date",
        "updated_date",
      ]);
      if ("permissions" in userFound.role) {
        userFound.role.permissions = await req.firebase.getObjectsByReference(
          userFound.role.permissions
        );
      }
    }

    userFound.last_login = new Date(userFound.last_login?.seconds * 1000);
    userFound.created_date = new Date(userFound.created_date?.seconds * 1000);
    userFound.updated_date = new Date(userFound.updated_date?.seconds * 1000);

    const userAccessToken = userFound.access_token.toString();
    const userRefreshToken = userFound.refresh_token.toString();

    userFound = req.firebase.cleanValuesDocument(userFound, [
      "account_suspension_day",
      "password",
      "access_token",
      "refresh_token",
      "validation_token",
    ]);

    return res.status(200).json({
      status_code: 200,
      data: {
        user: userFound,
        access_token: userAccessToken,
        refresh_token: userRefreshToken,
      },
      errors: [],
    });
  } catch (error) {
    console.log("system-user verify-access-token response - error", error);
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

    const userFound: SystemUser | null = await req.firebase.getOneDocument(
      SYSTEM_USER_COLLECTION,
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
      config.JWT_SYS_VALIDATION_SECRET,
      {
        expiresIn: "15min",
      }
    );
    const link = `${config.HOST_ADMIN}/auth/verify/?token=${token}`;

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(
      SYSTEM_USER_COLLECTION,
      userFound.id || "",
      {
        ...rest,
        access_token: "",
        refresh_token: "",
        validation_token: token,
        updated_date: generateUTCToLimaDate(),
      }
    );

    const template = templateEmailSystemRecoveryAccount({
      email: userFound.email,
      firstName: userFound.first_name,
      lastName: userFound.last_name,
      link,
    });
    const result = await sendMail(template, "system-user recovery-account");
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
    console.log("system-user recovery-account response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const verifyAccount = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  const token = req.headers["x-access-token"]?.toString() || "";
  try {
    const userFound: SystemUser | null = await req.firebase.getOneDocument(
      SYSTEM_USER_COLLECTION,
      [["validation_token", "==", token]]
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

    await req.firebase.updateDocumentById(SYSTEM_USER_COLLECTION, id, {
      ...rest,
      access_token: "",
      refresh_token: "",
      validation_token: "",
      verified: 1,
      updated_date: generateUTCToLimaDate(),
    });

    const link = `${config.HOST_ADMIN}/auth/login`;

    const template = templateEmailSystemVerifyAccount({
      email: userFound.email,
      firstName: userFound.first_name,
      lastName: userFound.last_name,
      link,
    });

    await sendMail(template, "system-user verify-account");

    return res.status(200).json({
      status_code: 200,
      message: "La cuenta fue verificada",
      errors: [],
    });
  } catch (error) {
    console.log("system-user verify-account response - error", error);
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

    const userFound: SystemUser | null = await req.firebase.getOneDocument(
      SYSTEM_USER_COLLECTION,
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
      config.JWT_SYS_VALIDATION_SECRET,
      {
        expiresIn: "15min",
      }
    );
    const link = `${config.HOST_ADMIN}/auth/restore/?token=${token}`;

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(
      SYSTEM_USER_COLLECTION,
      userFound.id || "",
      {
        ...rest,
        access_token: "",
        refresh_token: "",
        validation_token: token,
        updated_date: generateUTCToLimaDate(),
      }
    );

    const template = templateEmailSystemRecoveryPassword({
      email: userFound.email,
      firstName: userFound.first_name,
      lastName: userFound.last_name,
      link,
    });
    const result = await sendMail(template, "system-user recovery-password");
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
    console.log("system-user recovery-password response - error", error);
    return res
      .status(500)
      .json({ status: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const verifyPassword = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  const token = req.headers["x-access-token"]?.toString() || "";
  try {
    const userFound: SystemUser | null = await req.firebase.getOneDocument(
      SYSTEM_USER_COLLECTION,
      [["validation_token", "==", token]]
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
    console.log("system-user verify-password response - error", error);
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

    const userFound: SystemUser | null = await req.firebase.getOneDocument(
      SYSTEM_USER_COLLECTION,
      [["validation_token", "==", token]]
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

    await req.firebase.updateDocumentById(SYSTEM_USER_COLLECTION, id, {
      ...rest,
      access_token: "",
      refresh_token: "",
      validation_token: "",
      password: hash,
      updated_date: generateUTCToLimaDate(),
    });

    const link = `${config.HOST_ADMIN}/auth/login`;

    const template = templateEmailSystemChangePassword({
      email: userFound.email,
      firstName: userFound.first_name,
      lastName: userFound.last_name,
      link,
    });

    await sendMail(template, "system-user change-password");

    return res.status(200).json({
      status_code: 200,
      message: "contraseña actualizada",
      errors: [],
    });
  } catch (error) {
    console.log("system-user change-password response - error", error);
    return res
      .status(500)
      .json({ status: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const logout = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const accessToken = req.headers["x-access-token"]?.toString() || "";

    let userFound = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      req.userId
    );

    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (userFound.access_token !== accessToken) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const { id, ...rest } = userFound;

    await req.firebase.updateDocumentById(SYSTEM_USER_COLLECTION, id, {
      ...rest,
      access_token: "",
      refresh_token: "",
    });

    return res.status(200).json({
      status_code: 200,
      message: "Sesión cerrada",
      errors: [],
    });
  } catch (error) {
    console.log("system-user logout response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export {
  login,
  renewToken,
  verifyAccessToken,
  recoveryAccount,
  verifyAccount,
  recoveryPassword,
  verifyPassword,
  changePassword,
  logout,
};
