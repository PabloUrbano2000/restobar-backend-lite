import { Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";
import { RECEPTION_COLLECTION } from "../models/Collections";
import { ErrorFormat } from "../interfaces/Error";
import { validationResult } from "express-validator";
import { generateUTCToLimaDate } from "../helpers/generators";
import { Reception } from "../models/Reception";

const getReceptionsWithRequiresAttentionList = async (
  request: Request,
  res: Response
) => {
  const req = request as RequestServer;

  try {
    const result = await req.firebase.getDocumentsByFilter(
      RECEPTION_COLLECTION,
      [
        ["status", "==", 1],
        ["requires_attention", "==", 1],
      ],
      [
        ["code", "asc"],
        ["number_table", "asc"],
      ]
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
    console.log("dashboard get-reception-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const serveReception = async (request: Request, res: Response) => {
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
    const { id = undefined } = req.body;

    const receptionFound = await req.firebase.getDocumentById(
      RECEPTION_COLLECTION,
      id
    );

    if (!receptionFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "RECEPTION_NOT_FOUND",
        errors: ["Recepción no existente"],
      });
    }

    if (receptionFound.requires_attention === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "RECEPTION_IS_DISABLED",
        errors: ["La recepción no necesita atención"],
      });
    }

    const { id: receptionId, ...rest } = receptionFound;

    await req.firebase.updateDocumentById(RECEPTION_COLLECTION, id, {
      ...rest,
      requires_attention: 0,
      updated_date: generateUTCToLimaDate(),
    });

    const newReception = await req.firebase.getDocumentById(
      RECEPTION_COLLECTION,
      id
    );

    newReception.created_date = new Date(
      newReception.created_date?.seconds * 1000
    );
    newReception.updated_date = new Date(
      newReception.updated_date?.seconds * 1000
    );

    return res.status(200).json({
      status_code: 200,
      data: {
        reception: newReception,
      },
      message: "Recepción atendida éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("dashboard serve-reception response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export { getReceptionsWithRequiresAttentionList, serveReception };
