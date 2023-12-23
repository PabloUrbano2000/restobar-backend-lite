import { Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";
import { FieldPath, WhereFilterOp } from "firebase/firestore";
import { ErrorFormat } from "../interfaces/Error";
import { validationResult } from "express-validator";
import { USER_COLLECTION } from "../models/Collections";
const getList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  let {
    first_name = undefined,
    last_name = undefined,
    email = undefined,
    limit = 100,
    offset = 0,
  } = req.body;

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
  if (email) {
    filter.push(["email", "==", email]);
  }

  try {
    const result = await req.firebase.getDocumentsByFilter(
      USER_COLLECTION,
      filter,
      [
        ["first_name", "asc"],
        ["last_name", "asc"],
      ],
      { limit, offset }
    );

    if (result.docs.length > 0) {
      const documentTypesId: string[] = [];
      const documentTypesData: Promise<any>[] = [];

      const gendersId: string[] = [];
      const gendersData: Promise<any>[] = [];

      for (let data of result.docs) {
        if (
          data?.document_type?.id &&
          !documentTypesId.includes(data?.document_type?.id)
        ) {
          documentTypesId.push(data?.document_type?.id);
          documentTypesData.push(
            req.firebase.getObjectByReference(data.document_type)
          );
        }
      }

      for (let data of result.docs) {
        if (data?.gender?.id && !gendersId.includes(data?.gender?.id)) {
          gendersId.push(data?.gender?.id);
          gendersData.push(req.firebase.getObjectByReference(data.gender));
        }
      }

      const documentTypesResult = await Promise.all(documentTypesData);
      const gendersResult = await Promise.all(gendersData);

      const filterData = result.docs.map((data) => {
        if (data?.document_type?.id) {
          const documentTypeId = data.document_type.id || undefined;
          data.document_type = documentTypesResult.find(
            (cat) => cat.id == documentTypeId
          );

          data.document_type = req.firebase.cleanValuesDocument(
            data.document_type,
            [
              "status",
              "length",
              "sequential",
              "regex",
              "operation",
              "created_date",
              "updated_date",
            ]
          );
        }

        if (data?.gender?.id) {
          const genderId = data.gender.id || undefined;
          data.gender = gendersResult.find((cat) => cat.id == genderId);

          data.gender = req.firebase.cleanValuesDocument(data.gender, [
            "status",
            "created_date",
            "updated_date",
          ]);
        }

        let newData = {
          ...data,
          created_date:
            new Date(data?.created_date?.seconds * 1000) || undefined,
          updated_date:
            new Date(data?.updated_date?.seconds * 1000) || undefined,
          last_login: new Date(data?.last_login?.seconds * 1000) || undefined,
        };

        newData = req.firebase.showValuesDocument(newData, [
          "id",
          "email",
          "first_name",
          "last_name",
          "document_type",
          "document_number",
          "gender",
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
    console.log("user get-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getUser = async (request: Request, res: Response) => {
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

    const userFound = await req.firebase.getDocumentById(USER_COLLECTION, id);

    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Cliente no existente"],
      });
    }

    if (userFound.document_type) {
      userFound.document_type = await req.firebase.getObjectByReference(
        userFound.document_type
      );
      userFound.document_type = req.firebase.cleanValuesDocument(
        userFound.document_type,
        [
          "status",
          "length",
          "sequential",
          "regex",
          "operation",
          "created_date",
          "updated_date",
        ]
      );
    }

    if (userFound.gender) {
      userFound.gender = await req.firebase.getObjectByReference(
        userFound.gender
      );
      userFound.gender = req.firebase.cleanValuesDocument(userFound.gender, [
        "created_date",
        "updated_date",
      ]);
    }

    userFound.last_login = new Date(userFound.last_login?.seconds * 1000);
    userFound.created_date = new Date(userFound.created_date?.seconds * 1000);
    userFound.updated_date = new Date(userFound.updated_date?.seconds * 1000);

    const newUser = req.firebase.cleanValuesDocument(userFound, [
      "photo",
      "account_suspension_day",
      "password",
      "token",
      "tokens",
    ]);

    return res.status(200).json({
      status_code: 200,
      data: {
        user: newUser,
      },
      errors: [],
    });
  } catch (error) {
    console.log("user get-user response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export { getList, getUser };
