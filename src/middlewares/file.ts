import { Request } from "express";

interface FileProps {
  req?: Request;
  attribute?: string;
  extensions?: string[];
  maxSize?: number;
  errorMessage?: string;
}

const fileExists = ({ req, attribute = "", errorMessage = "" }: FileProps) => {
  if (
    !req?.files ||
    Object.keys(req?.files).length === 0 ||
    !req?.files[attribute]
  ) {
    throw Error(errorMessage || "El archivo es obligatorio");
  }
  return true;
};

const hasFileValidExtensions = ({
  req,
  attribute = "",
  extensions = [],
  errorMessage = "",
}: FileProps) => {
  const file = req?.files ? req?.files[attribute] : null;
  if (file && Object.keys(file).length > 0) {
    const { name = "" }: any = file || {};
    const shortName = name?.split(".");
    const extension = shortName[shortName.length - 1]?.toLowerCase();

    // Validar la extensión
    if (!extensions.includes(extension)) {
      throw Error(
        `${
          errorMessage || "la extensión del archivo no es permitida"
        } - ${extensions.join(", ")}`
      );
    }
  }
  return true;
};

const hasFileValidSize = ({
  req,
  attribute = "archivo",
  maxSize = 200000,
  errorMessage = "",
}: FileProps) => {
  const file = req?.files ? req?.files[attribute] : null;
  if (file && Object.keys(file).length > 0) {
    const { size = 0 }: any = file || {};
    if (size > maxSize) {
      let auxSize = maxSize;
      let unit = "kb";
      if (maxSize < 1000000) {
        unit = "kb";
        auxSize = maxSize / 1000;
      } else {
        unit = "mb";
        auxSize = maxSize / 1000000;
      }

      throw Error(
        `${
          errorMessage || "El archivo excede el tamaño máximo"
        } - ${auxSize}${unit}`
      );
    }
  }
  return true;
};

export { fileExists, hasFileValidExtensions, hasFileValidSize };
