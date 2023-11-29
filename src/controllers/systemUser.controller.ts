import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { RequestServer } from "../interfaces/Request";
import { FieldPath, WhereFilterOp } from "firebase/firestore";
import { SYSTEM_USER_COLLECTION } from "../models/SystemUser";
import { ErrorFormat } from "../interfaces/Error";
import { validationResult } from "express-validator";
import { ROLE_COLLECTION } from "../models/Role";
import { generateUTCToLimaDate, generatePassword } from "../helpers/generators";
import { encryptPassword } from "../helpers/passwords";
import config from "../config";
import { sendMail, templateEmailSystemWelcome } from "../emails";
import { SETTING_COLLECTION } from "../models/Collections";
import { Setting } from "../models/Entities";

const getList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  let { first_name = undefined, last_name = undefined } = req.query;

  const filter: [
    fieldPath: string | FieldPath,
    opStr: WhereFilterOp,
    value: unknown
  ][] = [];

  first_name && typeof first_name == "string"
    ? (first_name = first_name.trim())
    : (first_name = "");

  if (first_name) {
    filter.push(["first_name", "==", first_name]);
  }
  if (last_name) {
    filter.push(["last_name", "==", last_name]);
  }

  try {
    const result = await req.firebase.getDocumentsByFilter(
      SYSTEM_USER_COLLECTION,
      filter,
      [
        ["first_name", "asc"],
        ["last_name", "asc"],
      ]
    );

    if (result.docs.length > 0) {
      const filterData = result.docs.map((data) => {
        let newData = {
          ...data,
          last_login: new Date(data?.last_login?.seconds * 1000) || undefined,
          created_date:
            new Date(data?.created_date?.seconds * 1000) || undefined,
          updated_date:
            new Date(data?.updated_date?.seconds * 1000) || undefined,
        };

        newData = req.firebase.showValuesDocument(newData, [
          "id",
          "photo",
          "email",
          "first_name",
          "last_name",
          "verified",
          "status",
          "created_date",
          "updated_date",
          "last_login",
        ]);
        return newData;
      });

      result.docs = filterData;
    }

    return res.status(200).json({
      status_code: 200,
      ...result,
    });
  } catch (error) {
    console.log("system-user get-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getSystemUser = async (request: Request, res: Response) => {
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

    const userFound = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      id
    );

    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (userFound.role) {
      userFound.role = await req.firebase.getObjectByReference(userFound.role);
      userFound.role = req.firebase.cleanValuesDocument(userFound.role, [
        "created_date",
        "updated_date",
        "permissions",
      ]);
    }

    userFound.last_login = new Date(userFound.last_login?.seconds * 1000);
    userFound.created_date = new Date(userFound.created_date?.seconds * 1000);
    userFound.updated_date = new Date(userFound.updated_date?.seconds * 1000);

    const newUser = req.firebase.cleanValuesDocument(userFound, [
      "password",
      "access_token",
      "refresh_token",
      "validation_token",
    ]);

    return res.status(200).json({
      status_code: 200,
      data: {
        user: newUser,
      },
      errors: [],
    });
  } catch (error) {
    console.log("system-user get-system-user response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const createSystemUser = async (request: Request, res: Response) => {
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
    const { first_name = "", last_name = "", email = "", role = "" } = req.body;

    const isExistUserByEmail = await req.firebase.getOneDocument(
      SYSTEM_USER_COLLECTION,
      [["email", "==", email]]
    );

    if (isExistUserByEmail) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_EXIST",
        errors: ["El usuario ya se encuentra registrado"],
      });
    }

    const roleObject = await req.firebase.getDocumentById(
      ROLE_COLLECTION,
      role
    );

    if (!roleObject) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ROLE_NOT_FOUND",
        errors: ["El rol no existe"],
      });
    }

    const roleInstance = req.firebase.instanceReferenceById(
      ROLE_COLLECTION,
      roleObject.id
    );

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

    const password = generatePassword(8);

    const hash = await encryptPassword(password);

    let enableVerify = 0;

    if (settingFound.system_user_double_opt_in === 1) {
      enableVerify = 1;
    }

    const result = await req.firebase.insertDocument(SYSTEM_USER_COLLECTION, {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      second_last_name: "",
      email: email.trim(),
      password: hash,
      photo: "",
      status: 1,
      verified: enableVerify === 1 ? 0 : 1,
      access_token: "",
      refresh_token: "",
      validation_token: "",
      role: roleInstance,
      created_date: generateUTCToLimaDate(),
    });

    const userFound = await req.firebase.getDocumentById(
      SYSTEM_USER_COLLECTION,
      result.id
    );

    const token = jwt.sign(
      { id: result.id },
      config.JWT_SYS_VALIDATION_SECRET,
      {
        expiresIn: "15min",
      }
    );

    // si la cuenta requiere verificación actualizamos el usuario con su token de verificación
    if (enableVerify === 1) {
      await req.firebase.updateDocumentById(SYSTEM_USER_COLLECTION, result.id, {
        ...userFound,
        validation_token: token,
      });
    }

    const link = `${config.HOST_ADMIN}/auth/verify/?token=${token}`;

    const template = templateEmailSystemWelcome({
      email: email.trim(),
      firstName: first_name.trim(),
      lastName: last_name.trim(),
      link,
      password,
      isValidationEnable: enableVerify === 1 ? true : false,
    });

    const resEmail = await sendMail(template, "system-user create-system-user");

    if (resEmail.status_code !== 200) {
      return res.status(resEmail.status_code).json({
        ...result,
      });
    }

    userFound.last_login = new Date(userFound.last_login?.seconds * 1000);
    userFound.created_date = new Date(userFound.created_date?.seconds * 1000);
    userFound.updated_date = new Date(userFound.updated_date?.seconds * 1000);

    userFound.role = await req.firebase.getObjectByReference(userFound.role);
    userFound.role = req.firebase.cleanValuesDocument(userFound.role, [
      "created_date",
      "updated_date",
      "permissions",
    ]);

    const cleanUser = req.firebase.cleanValuesDocument(userFound, [
      "password",
      "access_token",
      "refresh_token",
      "validation_token",
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
    console.log("system-user create-system-user response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export { getList, getSystemUser, createSystemUser };
