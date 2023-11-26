import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { RequestServer } from "../interfaces/Request";
import { ErrorFormat } from "../interfaces/Error";
import { User, UserToken } from "../models/Entities";
import { USER_COLLECTION } from "../models/Collections";

import { validationResult } from "express-validator";
import { generateUTCToLimaDate } from "../helpers/generators";
import { comparePassword, encryptPassword } from "../helpers/passwords";
import {
  templateEmailUserRecoveryAccount,
  templateEmailUserVerifyAccount,
  templateEmailUserRecoveryPassword,
  templateEmailUserChangePassword,
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
    const { email = undefined, password = undefined } = req.body;
    const userFound: User | null = await req.firebase.getOneDocument(
      USER_COLLECTION,
      [{ field: "email", filter: "==", value: email }]
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
    await req.firebase.updateDocumentById(USER_COLLECTION, userFound.id || "", {
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

    newUser = req.firebase.cleanValuesDocument(newUser, [
      "last_login",
      "created_date",
      "updated_date",
      "password",
      "status",
      "access_token",
      "refresh_token",
      "tokens",
      "validation_token",
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

const renewToken = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const accessToken = req.headers["x-access-token"]?.toString() || "";
    const refreshToken = req.body.refresh_token;

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

    userFound.tokens.forEach((token) => {
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

    if (userFound.tokens)
      await req.firebase.updateDocumentById(USER_COLLECTION, id, {
        ...rest,
        tokens,
        updated_date: generateUTCToLimaDate(),
      });

    // buscamos el usuario por el id
    let newUser = await req.firebase.getDocumentById(
      USER_COLLECTION,
      userFound.id || ""
    );

    newUser = req.firebase.cleanValuesDocument(newUser, [
      "last_login",
      "created_date",
      "updated_date",
      "password",
      "status",
      "access_token",
      "refresh_token",
      "tokens",
      "validation_token",
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

// const recoveryAccount = async (request: Request, res: Response) => {
//   const req = request as RequestServer;
//   let errors: ErrorFormat[] = [];
//   const resultValidator = validationResult(req);

//   if (!resultValidator.isEmpty()) {
//     errors = resultValidator.array().map((data) => data.msg);

//     return res.status(400).json({
//       status_code: 400,
//       error_code: "INVALID_BODY_FIELDS",
//       errors,
//     });
//   }
//   try {
//     const { email = undefined } = request.body;

//     const userFound: SystemUser | null = await req.firebase.getOneDocument(
//       SYSTEM_USER_COLLECTION,
//       [{ field: "email", filter: "==", value: email }]
//     );
//     if (!userFound) {
//       return res.status(401).json({
//         status_code: 401,
//         error_code: "USER_NOT_FOUND",
//         errors: ["Correo electrónico no válido"],
//       });
//     }

//     if (userFound.verified == 1) {
//       return res.status(400).json({
//         status_code: 400,
//         error_code: "VERIFIED_USER_ACCOUNT",
//         errors: ["El usuario ya se encuentra verificado"],
//       });
//     }

//     const token = jwt.sign(
//       { id: userFound.id },
//       config.JWT_SYS_VALIDATION_SECRET,
//       {
//         expiresIn: "15min",
//       }
//     );
//     const link = `${config.HOST_ADMIN}/auth/verify/?token=${token}`;

//     const { id, ...rest } = userFound;

//     await req.firebase.updateDocumentById(
//       SYSTEM_USER_COLLECTION,
//       userFound.id || "",
//       {
//         ...rest,
//         access_token: "",
//         refresh_token: "",
//         validation_token: token,
//         updated_date: generateUTCToLimaDate(),
//       }
//     );

//     const template = templateEmailSystemRecoveryAccount({
//       email: userFound.email,
//       firstName: userFound.first_name,
//       lastName: userFound.last_name,
//       link,
//     });
//     const result = await sendMail(template, "system-user recovery-account");
//     if (result.status_code !== 200) {
//       return res.status(result.status_code).json({
//         ...result,
//       });
//     }
//     return res.status(200).json({
//       ...result,
//       message:
//         "Correo enviado éxitosamente, recuerde que el link expirará en 15 min.",
//     });
//   } catch (error) {
//     console.log("system-user recovery-account response - error", error);
//     return res
//       .status(500)
//       .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
//   }
// };

// const verifyAccount = async (request: Request, res: Response) => {
//   const req = request as RequestServer;

//   const token = req.headers["x-access-token"]?.toString() || "";
//   try {
//     const userFound: SystemUser | null = await req.firebase.getOneDocument(
//       SYSTEM_USER_COLLECTION,
//       [
//         {
//           field: "validation_token",
//           filter: "==",
//           value: token,
//         },
//       ]
//     );
//     if (!userFound) {
//       return res.status(401).json({
//         status_code: 401,
//         error_code: "USER_NOT_FOUND",
//         errors: ["Usuario no existente"],
//       });
//     }

//     if (userFound.id !== req.userId) {
//       return res.status(401).json({
//         status_code: 401,
//         error_code: "INVALID_TOKEN",
//         errors: ["Token inválido"],
//       });
//     }

//     if (userFound.verified == 1) {
//       return res.status(400).json({
//         status_code: 400,
//         error_code: "VERIFIED_USER_ACCOUNT",
//         errors: ["El usuario ya se encuentra verificado"],
//       });
//     }

//     const { id, ...rest } = userFound;

//     await req.firebase.updateDocumentById(SYSTEM_USER_COLLECTION, id, {
//       ...rest,
//       access_token: "",
//       refresh_token: "",
//       validation_token: "",
//       verified: 1,
//       updated_date: generateUTCToLimaDate(),
//     });

//     const link = `${config.HOST_ADMIN}/auth/login`;

//     const template = templateEmailSystemVerifyAccount({
//       email: userFound.email,
//       firstName: userFound.first_name,
//       lastName: userFound.last_name,
//       link,
//     });

//     await sendMail(template, "system-user verify-account");

//     return res.status(200).json({
//       status_code: 200,
//       message: "La cuenta fue verificada",
//       errors: [],
//     });
//   } catch (error) {
//     console.log("system-user verify-account response - error", error);
//     return res
//       .status(500)
//       .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
//   }
// };

// const recoveryPassword = async (request: Request, res: Response) => {
//   const req = request as RequestServer;
//   let errors: ErrorFormat[] = [];
//   const resultValidator = validationResult(req);

//   if (!resultValidator.isEmpty()) {
//     errors = resultValidator.array().map((data) => data.msg);

//     return res.status(400).json({
//       status_code: 400,
//       error_code: "INVALID_BODY_FIELDS",
//       errors,
//     });
//   }
//   try {
//     const { email = undefined } = request.body;

//     const userFound: SystemUser | null = await req.firebase.getOneDocument(
//       SYSTEM_USER_COLLECTION,
//       [{ field: "email", filter: "==", value: email }]
//     );
//     if (!userFound) {
//       return res.status(401).json({
//         status_code: 401,
//         error_code: "USER_NOT_FOUND",
//         errors: ["Correo electrónico no válido"],
//       });
//     }
//     const token = jwt.sign(
//       { id: userFound.id },
//       config.JWT_SYS_VALIDATION_SECRET,
//       {
//         expiresIn: "15min",
//       }
//     );
//     const link = `${config.HOST_ADMIN}/auth/restore/?token=${token}`;

//     const { id, ...rest } = userFound;

//     await req.firebase.updateDocumentById(
//       SYSTEM_USER_COLLECTION,
//       userFound.id || "",
//       {
//         ...rest,
//         access_token: "",
//         refresh_token: "",
//         validation_token: token,
//         updated_date: generateUTCToLimaDate(),
//       }
//     );

//     const template = templateEmailSystemRecoveryPassword({
//       email: userFound.email,
//       firstName: userFound.first_name,
//       lastName: userFound.last_name,
//       link,
//     });
//     const result = await sendMail(template, "system-user recovery-password");
//     if (result.status_code !== 200) {
//       return res.status(result.status_code).json({
//         ...result,
//       });
//     }
//     return res.status(200).json({
//       ...result,
//       message:
//         "Correo enviado éxitosamente, recuerde que el link expirará en 15 min.",
//     });
//   } catch (error) {
//     console.log("system-user recovery-password response - error", error);
//     return res
//       .status(500)
//       .json({ status: 500, errors: ["Ocurrió un error desconocido"] });
//   }
// };

// const verifyPassword = async (request: Request, res: Response) => {
//   const req = request as RequestServer;

//   const token = req.headers["x-access-token"]?.toString() || "";
//   try {
//     const userFound: SystemUser | null = await req.firebase.getOneDocument(
//       SYSTEM_USER_COLLECTION,
//       [
//         {
//           field: "validation_token",
//           filter: "==",
//           value: token,
//         },
//       ]
//     );
//     if (!userFound) {
//       return res.status(401).json({
//         status_code: 401,
//         error_code: "USER_NOT_FOUND",
//         errors: ["Usuario no existente"],
//       });
//     }

//     if (userFound.id !== req.userId) {
//       return res.status(401).json({
//         status_code: 401,
//         error_code: "INVALID_TOKEN",
//         errors: ["Token inválido"],
//       });
//     }
//     return res.status(200).json({
//       status_code: 200,
//       message: "Token de recuperación válido",
//       errors: [],
//     });
//   } catch (error) {
//     console.log("system-user verify-password response - error", error);
//     return res
//       .status(500)
//       .json({ status: 500, errors: ["Ocurrió un error desconocido"] });
//   }
// };

// const changePassword = async (request: Request, res: Response) => {
//   const req = request as RequestServer;

//   let errors: ErrorFormat[] = [];
//   const resultValidator = validationResult(req);

//   if (!resultValidator.isEmpty()) {
//     errors = resultValidator.array().map((data) => data.msg);

//     return res.status(400).json({
//       status_code: 400,
//       error_code: "INVALID_BODY_FIELDS",
//       errors,
//     });
//   }

//   try {
//     const token = request.headers["x-access-token"]?.toString() || "";

//     const { new_password = undefined } = req.body;

//     const userFound: SystemUser | null = await req.firebase.getOneDocument(
//       SYSTEM_USER_COLLECTION,
//       [
//         {
//           field: "validation_token",
//           filter: "==",
//           value: token,
//         },
//       ]
//     );
//     if (!userFound) {
//       return res.status(401).json({
//         status_code: 401,
//         error_code: "USER_NOT_FOUND",
//         errors: ["Usuario no existente"],
//       });
//     }

//     if (userFound.id !== req.userId) {
//       return res.status(401).json({
//         status_code: 401,
//         error_code: "INVALID_TOKEN",
//         errors: ["Token inválido"],
//       });
//     }

//     const hash = await encryptPassword(new_password);

//     const { id, ...rest } = userFound;

//     await req.firebase.updateDocumentById(SYSTEM_USER_COLLECTION, id, {
//       ...rest,
//       access_token: "",
//       refresh_token: "",
//       validation_token: "",
//       password: hash,
//       updated_date: generateUTCToLimaDate(),
//     });

//     const link = `${config.HOST_ADMIN}/auth/login`;

//     const template = templateEmailSystemChangePassword({
//       email: userFound.email,
//       firstName: userFound.first_name,
//       lastName: userFound.last_name,
//       link,
//     });

//     await sendMail(template, "system-user change-password");

//     return res.status(200).json({
//       status_code: 200,
//       message: "contraseña actualizada",
//       errors: [],
//     });
//   } catch (error) {
//     console.log("system-user change-password response - error", error);
//     return res
//       .status(500)
//       .json({ status: 500, errors: ["Ocurrió un error desconocido"] });
//   }
// };

export {
  login,
  renewToken,
  // recoveryAccount,
  // verifyAccount,
  // recoveryPassword,
  // verifyPassword,
  // changePassword,
};
