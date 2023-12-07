import { RequestServer } from "../interfaces/Request";
import {
  DOCUMENT_TYPE_COLLECTION,
  OPERATION_TYPE,
} from "../models/DocumentType";

interface DocumentTypeProps {
  req: Request | any;
  documentType: string;
  documentNumber: string;
}

const isValidDocumentType = async ({
  req,
  documentType = "",
  documentNumber = "",
}: DocumentTypeProps) => {
  const request = req as RequestServer;

  const documentTypeFound = await request.firebase.getDocumentById(
    DOCUMENT_TYPE_COLLECTION,
    documentType
  );
  if (
    !documentTypeFound ||
    documentTypeFound.operation !== OPERATION_TYPE.IDENTITY ||
    !documentTypeFound.regex
  ) {
    throw Error("El tipo de documento es inválido");
  }

  if (!new RegExp(documentTypeFound?.regex)?.test(documentNumber)) {
    throw Error("El número de documento es inválido");
  }

  return true;
};

export { isValidDocumentType };
