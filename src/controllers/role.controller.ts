import { Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";

import { ROLE_COLLECTION } from "../models/Collections";

const getList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  try {
    const result = await req.firebase.getDocumentsByFilter(
      ROLE_COLLECTION,
      [],
      [["name", "asc"]]
    );

    if (result.docs.length > 0) {
      const filterData = result.docs.map((data) => {
        const newData = {
          ...data,
          created_date:
            new Date(data?.created_date?.seconds * 1000) || undefined,
          updated_date:
            new Date(data?.updated_date?.seconds * 1000) || undefined,
        };

        return req.firebase.cleanValuesDocument(newData, ["permissions"]);
      });

      result.docs = filterData;
    }

    return res.status(200).json({
      status_code: 200,
      ...result,
    });
  } catch (error) {
    console.log("role get-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export { getList };
