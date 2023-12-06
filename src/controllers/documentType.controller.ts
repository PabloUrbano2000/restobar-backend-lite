import { Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";
import {
  DOCUMENT_TYPE_COLLECTION,
  OPERATION_TYPE,
} from "../models/DocumentType";
import { FieldPath, WhereFilterOp } from "firebase/firestore";

const getList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  let { operation = "" } = req.body;

  const filter: [
    fieldPath: string | FieldPath,
    opStr: WhereFilterOp,
    value: unknown
  ][] = [];

  operation && typeof operation == "string"
    ? (operation = operation.toUpperCase().trim())
    : (operation = "");

  if (
    operation === OPERATION_TYPE.IDENTITY ||
    operation === OPERATION_TYPE.TRANSACTION
  ) {
    filter.push(["operation", "==", operation]);
  }
  try {
    const result = await req.firebase.getDocumentsByFilter(
      DOCUMENT_TYPE_COLLECTION,
      filter,
      [["name", "asc"]]
    );

    if (result.docs.length > 0) {
      const filterData = result.docs.map((data) => ({
        ...data,
        created_date: new Date(data?.created_date?.seconds * 1000) || undefined,
        updated_date: new Date(data?.updated_date?.seconds * 1000) || undefined,
      }));

      result.docs = filterData;
    }

    return res.status(200).json({
      status_code: 200,
      ...result,
    });
  } catch (error) {
    console.log("document-type get-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getClientList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const result = await req.firebase.getDocumentsByFilter(
      DOCUMENT_TYPE_COLLECTION,
      [
        ["operation", "==", OPERATION_TYPE.IDENTITY],
        ["status", "==", 1],
      ],
      [["name", "asc"]]
    );

    if (result.docs.length > 0) {
      const filterData = result.docs.map((data) => {
        data = req.firebase.showValuesDocument(data, [
          "code",
          "name",
          "id",
          "regex",
        ]);

        return data;
      });
      result.docs = filterData;
    }

    return res.status(200).json({
      status_code: 200,
      docs: result.docs,
    });
  } catch (error) {
    console.log("document-type get-public-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export { getList, getClientList };
