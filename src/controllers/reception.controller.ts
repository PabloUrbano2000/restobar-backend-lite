import { Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";
import { RECEPTION_COLLECTION } from "../models/Collections";
import { ErrorFormat } from "../interfaces/Error";
import { validationResult } from "express-validator";
import { generateUTCToLimaDate } from "../helpers/generators";
import { Reception } from "../models/Reception";

const getList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const result = await req.firebase.getDocumentsByFilter(
      RECEPTION_COLLECTION,
      [],
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
    console.log("reception get-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getReception = async (request: Request, res: Response) => {
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

    receptionFound.created_date = new Date(
      receptionFound.created_date?.seconds * 1000
    );
    receptionFound.updated_date = new Date(
      receptionFound.updated_date?.seconds * 1000
    );

    return res.status(200).json({
      status_code: 200,
      data: {
        reception: receptionFound,
      },
      errors: [],
    });
  } catch (error) {
    console.log("reception get-reception response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const createReception = async (request: Request, res: Response) => {
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
      number_table = "",
      code = "",
      status = undefined,
      available = undefined,
    } = req.body;

    const isExistReceptionByNumberTable = await req.firebase.getOneDocument(
      RECEPTION_COLLECTION,
      [["number_table", "==", number_table?.toUpperCase()]]
    );

    if (isExistReceptionByNumberTable) {
      return res.status(401).json({
        status_code: 401,
        error_code: "RECEPTION_EXIST",
        errors: [
          "La recepción ya se encuentra registrada por el número de mesa",
        ],
      });
    }

    const isExistReceptionByCode = await req.firebase.getOneDocument(
      RECEPTION_COLLECTION,
      [["code", "==", code?.toUpperCase()]]
    );

    if (isExistReceptionByCode) {
      return res.status(401).json({
        status_code: 401,
        error_code: "RECEPTION_EXIST",
        errors: ["La recepción ya se encuentra registrada por el código"],
      });
    }

    let attributes: Reception = {};

    if (typeof status !== "undefined") {
      attributes.status = status;
    }

    if (typeof available !== "undefined") {
      attributes.available = available;
    }

    const result = await req.firebase.insertDocument(RECEPTION_COLLECTION, {
      number_table: number_table,
      code: code,
      status: 1,
      available: 1,
      ...attributes,
      created_date: generateUTCToLimaDate(),
    });

    const receptionFound = await req.firebase.getDocumentById(
      RECEPTION_COLLECTION,
      result.id
    );

    receptionFound.created_date = new Date(
      receptionFound.created_date?.seconds * 1000
    );
    receptionFound.updated_date = new Date(
      receptionFound.updated_date?.seconds * 1000
    );

    return res.status(200).json({
      status_code: 200,
      data: {
        reception: receptionFound,
      },
      message: "Recepción registrada éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("reception create-reception response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const updateReception = async (request: Request, res: Response) => {
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
      id = "",
      number_table = undefined,
      code = undefined,
      status = undefined,
      available = undefined,
    } = req.body;

    if (
      number_table === undefined &&
      code === undefined &&
      status === undefined &&
      available === undefined
    ) {
      return res.status(400).json({
        status_code: 400,
        error_code: "INVALID_BODY_FIELDS",
        errors: ["No se envió información para actualizar"],
      });
    }

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

    if (number_table !== undefined) {
      const { docs } = await req.firebase.getDocumentsByFilter(
        RECEPTION_COLLECTION,
        [["number_table", "==", number_table?.toUpperCase()]]
      );

      if (docs.length > 0) {
        const hasDuplicate = docs.some((doc: Reception) => doc.id !== id);
        if (hasDuplicate) {
          return res.status(401).json({
            status_code: 401,
            error_code: "RECEPTION_EXIST",
            errors: ["Ya existe una recepción con el mismo número de mesa"],
          });
        }
      }
    }

    if (code !== undefined) {
      const { docs } = await req.firebase.getDocumentsByFilter(
        RECEPTION_COLLECTION,
        [["code", "==", code?.toUpperCase()]]
      );

      if (docs.length > 0) {
        const hasDuplicate = docs.some((doc: Reception) => doc.id !== id);
        if (hasDuplicate) {
          return res.status(401).json({
            status_code: 401,
            error_code: "RECEPTION_EXIST",
            errors: ["Ya existe una recepción con el mismo código de mesa"],
          });
        }
      }
    }

    let attributes: any = {};

    if (number_table) {
      attributes.number_table = number_table;
    }
    if (code) {
      attributes.code = code;
    }

    if (typeof status === "number") {
      attributes.status = status;
    }

    if (typeof available === "number") {
      attributes.available = available;
    }

    const { id: receptionId, ...rest } = receptionFound;

    await req.firebase.updateDocumentById(RECEPTION_COLLECTION, id, {
      ...rest,
      ...attributes,
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
      message: "Recepción actualizada éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("reception update-reception response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const disableReception = async (request: Request, res: Response) => {
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

    if (receptionFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "RECEPTION_IS_DISABLED",
        errors: ["La recepción se encuentra inhabilitada"],
      });
    }

    const { id: receptionId, ...rest } = receptionFound;

    await req.firebase.updateDocumentById(RECEPTION_COLLECTION, id, {
      ...rest,
      status: 0,
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
      message: "Recepción inhabilitada éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("reception disable-reception response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const enableReception = async (request: Request, res: Response) => {
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

    if (receptionFound.status === 1) {
      return res.status(401).json({
        status_code: 401,
        error_code: "RECEPTION_IS_ENABLED",
        errors: ["La recepción se encuentra habilitada"],
      });
    }

    const { id: receptionId, ...rest } = receptionFound;

    await req.firebase.updateDocumentById(RECEPTION_COLLECTION, id, {
      ...rest,
      status: 1,
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
      message: "Recepción habilitada éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("reception enable-reception response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const unavailableReception = async (request: Request, res: Response) => {
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

    if (receptionFound.available === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "RECEPTION_IS_UNAVAILABLE",
        errors: ["La recepción se encuentra indisponible"],
      });
    }

    const { id: receptionId, ...rest } = receptionFound;

    await req.firebase.updateDocumentById(RECEPTION_COLLECTION, id, {
      ...rest,
      available: 0,
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
      message: "Recepción indisponible éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("reception unavailable-reception response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const availableReception = async (request: Request, res: Response) => {
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

    if (receptionFound.available === 1) {
      return res.status(401).json({
        status_code: 401,
        error_code: "RECEPTION_IS_AVAILABLE",
        errors: ["La recepción se encuentra disponible"],
      });
    }

    const { id: receptionId, ...rest } = receptionFound;

    await req.firebase.updateDocumentById(RECEPTION_COLLECTION, id, {
      ...rest,
      available: 1,
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
      message: "Recepción disponible éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("reception available-reception response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getClientList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const result = await req.firebase.getDocumentsByFilter(
      RECEPTION_COLLECTION,
      [["status", "==", 1]],
      [["code", "asc"]]
    );

    if (result.docs.length > 0) {
      const filterData = result.docs.map((data) => {
        data = req.firebase.showValuesDocument(data, [
          "id",
          "number_table",
          "available",
          "code",
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
    console.log("reception get-public-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export {
  getList,
  getReception,
  createReception,
  updateReception,
  disableReception,
  enableReception,
  unavailableReception,
  availableReception,
  getClientList,
};
