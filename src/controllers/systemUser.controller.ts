import { Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";
import { FieldPath, WhereFilterOp } from "firebase/firestore";
import { SYSTEM_USER_COLLECTION } from "../models/SystemUser";

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
          last_login: new Date(data?.created_date?.seconds * 1000) || undefined,
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

export { getList };
