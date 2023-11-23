import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import nodemailer from "nodemailer";
import { RequestServer } from "../interfaces/Request";
import { ErrorFormat } from "../interfaces/Error";
import {
  SYSTEM_USER_COLLECTION,
  SystemUser,
  comparePassword,
} from "../models/SystemUser";

import { validationResult } from "express-validator";
import { generateUTCToLimaDate } from "../helpers/generators";

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
    const userFound: SystemUser | null = await req.firebase.getOneDocument(
      SYSTEM_USER_COLLECTION,
      [{ field: "email", filter: "==", value: email }]
    );

    // si no se encuentra dentro de los usuarios
    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: [
          "No se reconoce esa combinación de correo electrónico y contraseña",
        ],
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

    if (typeof userFound.verified === "number" && userFound.verified === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_VERIFIED",
        errors: ["Cuenta aún no verificada, por favor valide su cuenta"],
      });
    }

    if (typeof userFound.status === "number" && userFound.status === 0) {
      return res.status(400).json({
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
        expiresIn: 86400 + 3600 * 2, //26 horas
      }
    );

    const { id, ...rest } = userFound;

    // actualizamos el usuario con sus nuevas credenciales
    await req.firebase.updateDocument(
      SYSTEM_USER_COLLECTION,
      userFound.id || "",
      {
        ...rest,
        access_token: token,
        refresh_token: refreshToken,
        validation_token: null,
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
      if ("permissions" in newUser.role) {
        newUser.role.permissions = await req.firebase.getObjectsByReference(
          newUser.role.permissions
        );
      }
    }

    newUser.updated_date = new Date(newUser.updated_date?.seconds * 1000);

    const userAccessToken = newUser.access_token.toString();
    const userRefreshToken = newUser.refresh_token.toString();

    newUser = await req.firebase.cleanValuesDocument(newUser, [
      "password",
      "access_token",
      "refresh_token",
      "validation_token",
    ]);

    return res.json({
      status: 200,
      data: {
        user: newUser,
        access_token: userAccessToken,
        refresh_token: userRefreshToken,
      },
      errors: errors,
    });
  } catch (error) {
    console.log("login response - error", error);
    return res
      .status(400)
      .json({ status: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

// const renewToken = async (req: Request, res: Response) => {
//   const recycleToken = req.headers["x-access-token"]?.toString() || "";

//   try {
//     if (!recycleToken) {
//       res.status(401).json({
//         status: 401,
//         message: "Token no encontrado",
//       });
//     }
//     const userFound = await User.findOne(
//       { refreshToken: { $in: recycleToken } },
//       { password: 0 }
//     );

//     if (!userFound) {
//       return res.status(400).json({
//         status: 401,
//         message: "Token inválido",
//       });
//     }

//     const user: any = jwt.verify(userFound.refreshToken, config.REFRESH_SECRET);
//     const { id = undefined } = user;

//     if (!id) {
//       return res.status(401).json({
//         status: 401,
//         message: "Token inválido",
//       });
//     }

//     const accessToken = jwt.sign({ id }, config.SECRET, {
//       expiresIn: 86400,
//     });

//     const refreshToken = jwt.sign({ id }, config.REFRESH_SECRET, {
//       expiresIn: 86400, //24 horas
//     });

//     await User.findByIdAndUpdate(
//       id,
//       {
//         token: accessToken,
//         refreshToken,
//         recoveryToken: undefined,
//         updatedDate: generateUTCToLimaDate(),
//       },
//       {
//         new: true,
//       }
//     );

//     const newUser = await User.findOne(
//       {
//         token: { $in: accessToken },
//       },
//       { password: 0, recoveryToken: 0 }
//     )
//       .populate("employee")
//       .populate("role");

//     return res.json({ status: 200, user: newUser });
//   } catch (error) {
//     return res.status(401).json({ status: 401, message: "Token inválido" });
//   }
// };

// const sentRecovery = async (req: Request, res: Response) => {
//   const { username = undefined } = req.body;
//   try {
//     if (!username) {
//       return res
//         .status(400)
//         .json({ status: 400, message: "El Correo es obligatorio" });
//     }
//     const user = await User.findOne({
//       username: { $in: username },
//     });
//     if (!user) {
//       return res
//         .status(400)
//         .json({ status: 400, message: "Usuario no encontrado" });
//     }
//     const token = jwt.sign({ id: user._id }, config.RECOVERY_SECRET, {
//       expiresIn: "15min",
//     });
//     const link = `${config.HOST_URL}/auth/restore/?token=${token}`;

//     await User.findByIdAndUpdate(
//       user._id,
//       {
//         token: undefined,
//         refreshToken: undefined,
//         recoveryToken: token,
//         updatedDate: generateUTCToLimaDate(),
//       },
//       {
//         new: true,
//       }
//     );

//     const mail = {
//       from: `${config.SMTP_EMAIL}`,
//       to: `${user.username}`,
//       subject: "Recupera tu contraseña",
//       html: `
//       <p style="margin:0; font-size:14px;">Hola ${user.username},</p>
//       <p style="margin:15px 0 0; font-size:13px;">Haz click <a style="" href="${link}">aquí</a> para restaurar tu contraseña.</p>
//       <p style="margin:20px 0 0; font-size:13px;">Si no solicitaste cambiar tu contraseña haga caso omiso a este mensaje.</p>
//       <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
//       <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ LABBIO SRL.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
//     };
//     const rta: any = await sendMail(mail);
//     return res.status(200).json({ status: 200, ...rta });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({ status: 400, message: "Ocurrió un error" });
//   }
// };

// const verifyToken = async (req: Request, res: Response) => {
//   const token = req.headers["x-access-token"]?.toString() || "";
//   try {
//     if (!token) {
//       return res.status(400).json({
//         status: 400,
//         message: "Token inválido",
//       });
//     }
//     const user: any = jwt.verify(token, config.RECOVERY_SECRET);
//     const { id = undefined } = user || {};
//     if (!id) {
//       return res.status(400).json({
//         status: 400,
//         message: "Token inválido",
//       });
//     }

//     const userFound = await User.findOne({
//       _id: { $in: id },
//       recoveryToken: { $in: token },
//     });
//     if (!userFound) {
//       return res.status(400).json({
//         status: 400,
//         message: "Token inválido",
//       });
//     }
//     return res.status(200).json({
//       status: 200,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       status: 400,
//       message: "Token inválido",
//     });
//   }
// };
// const changePassword = async (req: Request, res: Response) => {
//   const token = req.headers["x-access-token"]?.toString() || "";
//   try {
//     const { newPassword = undefined, confirmPassword = undefined } = req.body;
//     if (!token) {
//       return res.status(401).json({
//         status: 401,
//         message: "Acción denegada",
//       });
//     }
//     if (!newPassword) {
//       return res.status(400).json({
//         status: 400,
//         message: "La nueva contraseña es obligatoria",
//       });
//     }
//     if (newPassword !== confirmPassword) {
//       return res.status(400).json({
//         status: 400,
//         message: "No coinciden las contraseñas",
//       });
//     }

//     const user: any = jwt.verify(token, config.RECOVERY_SECRET);
//     const { id = undefined } = user || {};
//     if (!id) {
//       return res.status(400).json({
//         status: 400,
//         message: "Su token ha caducado",
//       });
//     }

//     const userFound = await User.findById(id);

//     if (userFound.recoveryToken !== token) {
//       return res.status(400).json({
//         status: 400,
//         message: "Permiso denegado",
//       });
//     }

//     const hash = await encryptPassword(newPassword);

//     await User.findByIdAndUpdate(id, {
//       token: undefined,
//       refreshToken: undefined,
//       recoveryToken: undefined,
//       password: hash,
//       updatedDate: generateUTCToLimaDate(),
//     });
//     return res.status(200).json({ status: 200, message: "password changed" });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({
//       status: 400,
//       message: "Ocurrió un error desconocido",
//     });
//   }
// };

// const sendMail = async (infoMail: any) => {
//   try {
//     let transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 465,
//       tls: {
//         rejectUnauthorized: false,
//       },
//       secure: true, // true for 465, false for other ports
//       auth: {
//         user: `${config.SMTP_EMAIL}`,
//         pass: `${config.SMTP_PASSWORD}`,
//       },
//     });
//     await transporter.sendMail(infoMail);
//     return {
//       status: 200,
//       message: "Mail Sent",
//     };
//   } catch (error) {
//     console.log(error);
//     return {
//       status: 400,
//       message: "Ocurrió un error",
//     };
//   }
// };

export {
  login,
  // , renewToken, verifyToken, sentRecovery, changePassword
};
