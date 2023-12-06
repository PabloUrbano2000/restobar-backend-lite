import { Router } from "express";
import {
  fileExists,
  hasFileValidExtensions,
  hasFileValidSize,
  verifyPermissions,
  verifySysUserAccessToken,
} from "../middlewares";
import {
  availableProduct,
  unavailableProduct,
  disableProduct,
  enableProduct,
  createProduct,
  updateProduct,
  uploadProductImage,
  getList,
  getProduct,
  deleteProductImage,
} from "../controllers/product.controller";
import { body } from "express-validator";
import { descripRegex, productExtendRegex } from "../utilities/regex";

const router = Router();

router.post(
  "/list",
  [verifySysUserAccessToken, verifyPermissions("PRODUCTS")],
  getList
);

router.post(
  "/get",
  [
    verifySysUserAccessToken,
    verifyPermissions("PRODUCTS"),
    body("id").notEmpty().withMessage("El id del producto es obligatorio"),
  ],
  getProduct
);

router.put(
  "/image/upload",
  [
    verifySysUserAccessToken,
    verifyPermissions("PRODUCTS"),
    body("id").notEmpty().withMessage("El id del producto es obligatorio"),
    body().custom((_, { req }: any) => {
      return fileExists({
        req,
        attribute: "image",
        errorMessage: "La imagen es obligatoria",
      });
    }),
    body().custom((_, { req }: any) => {
      return hasFileValidSize({
        req,
        attribute: "image",
        errorMessage: "El tamaño de la imagen excede el tamaño límite",
      });
    }),
    body().custom((_, { req }: any) => {
      return hasFileValidExtensions({
        req,
        attribute: "image",
        extensions: ["jpeg", "jpg", "png"],
        errorMessage: "La imagen no tiene una extensión válida",
      });
    }),
  ],
  uploadProductImage
);

router.put(
  "/image/upload",
  [
    verifySysUserAccessToken,
    verifyPermissions("PRODUCTS"),
    body("id").notEmpty().withMessage("El id del producto es obligatorio"),
    body().custom((_, { req }: any) => {
      return fileExists({
        req,
        attribute: "image",
        errorMessage: "La imagen es obligatoria",
      });
    }),
    body().custom((_, { req }: any) => {
      return hasFileValidSize({
        req,
        attribute: "image",
        errorMessage: "El tamaño de la imagen excede el tamaño límite",
      });
    }),
    body().custom((_, { req }: any) => {
      return hasFileValidExtensions({
        req,
        attribute: "image",
        extensions: ["jpeg", "jpg", "png"],
        errorMessage: "La imagen no tiene una extensión válida",
      });
    }),
  ],
  uploadProductImage
);

router.put(
  "/image/delete",
  [
    verifySysUserAccessToken,
    verifyPermissions("PRODUCTS"),
    body("id").notEmpty().withMessage("El id del producto es obligatorio"),
  ],
  deleteProductImage
);

router.post(
  "/create",
  [
    verifySysUserAccessToken,
    verifyPermissions("PRODUCTS"),
    body("name")
      .notEmpty()
      .withMessage("El nombre es obligatorio")
      .isString()
      .withMessage("El nombre debe ser una cadena")
      .isLength({ min: 4, max: 50 })
      .withMessage("El nombre debe tener entre 4 a 50 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!productExtendRegex.test(data.toString())) {
            throw Error("Nombre con formato inválido");
          }
        }
        return true;
      }),
    body("price")
      .notEmpty()
      .withMessage("El precio es obligatorio")
      .isNumeric()
      .withMessage("El precio debe ser un número")
      .isFloat({ min: 1.0, max: 1000 })
      .withMessage("El precio debe valer entre 1 a 1000"),

    body("description")
      .notEmpty()
      .withMessage("La descripción es obligatoria")
      .isString()
      .withMessage("La descripción debe ser una cadena")
      .custom((data: string) => {
        if (data) {
          if (!descripRegex.test(data.toString())) {
            throw Error("Descripción con formato inválido");
          }
        }
        return true;
      }),
    body("category")
      .notEmpty()
      .withMessage("La categoría es obligatoria")
      .isString()
      .withMessage("La categoría debe ser una cadena"),
    body("available")
      .optional()
      .isNumeric()
      .withMessage("La disponibilidad debe ser un número")
      .custom((data: string) => {
        if (data) {
          if (!new RegExp(/^(0|1)$/).test(data.toString())) {
            throw Error("Disponibidad con formato inválido");
          }
        }
        return true;
      }),

    body("status")
      .optional()
      .isNumeric()
      .withMessage("El estado debe ser un número")
      .custom((data: string) => {
        if (data) {
          if (!new RegExp(/^(0|1)$/).test(data.toString())) {
            throw Error("Estado con formato inválido");
          }
        }
        return true;
      }),
  ],
  createProduct
);

router.put(
  "/update",
  [verifySysUserAccessToken, verifyPermissions("PRODUCTS")],
  body("id")
    .notEmpty()
    .withMessage("El id es obligatorio")
    .isString()
    .withMessage("El id debe ser una cadena"),
  body("name")
    .optional()
    .isString()
    .withMessage("El nombre debe ser una cadena")
    .isLength({ min: 4, max: 50 })
    .withMessage("El nombre debe tener entre 4 a 50 caracteres")
    .custom((data: string) => {
      if (data) {
        if (!productExtendRegex.test(data.toString())) {
          throw Error("Nombre con formato inválido");
        }
      }
      return true;
    }),
  body("price")
    .optional()
    .isNumeric()
    .withMessage("El precio debe ser un número")
    .isFloat({ min: 1.0, max: 1000 })
    .withMessage("El precio debe valer entre 1 a 1000"),

  body("description")
    .optional()
    .isString()
    .withMessage("La descripción debe ser una cadena")
    .custom((data: string) => {
      if (data) {
        if (!descripRegex.test(data.toString())) {
          throw Error("Descripción con formato inválido");
        }
      }
      return true;
    }),
  body("category")
    .optional()
    .isString()
    .withMessage("La categoría es obligatoria")
    .isString()
    .withMessage("La categoría debe ser una cadena"),
  body("available")
    .optional()
    .isNumeric()
    .withMessage("La disponibilidad debe ser un número")
    .custom((data: string) => {
      if (data) {
        if (!new RegExp(/^(0|1)$/).test(data.toString())) {
          throw Error("Disponibidad con formato inválido");
        }
      }
      return true;
    }),
  body("status")
    .optional()
    .isNumeric()
    .withMessage("El estado debe ser un número")
    .custom((data: string) => {
      if (data) {
        if (!new RegExp(/^(0|1)$/).test(data.toString())) {
          throw Error("Estado con formato inválido");
        }
      }
      return true;
    }),
  updateProduct
);

router.put(
  "/disable",
  [verifySysUserAccessToken, verifyPermissions("PRODUCTS")],
  body("id")
    .notEmpty()
    .withMessage("El id es obligatorio")
    .isString()
    .withMessage("El id debe ser una cadena"),
  disableProduct
);

router.put(
  "/enable",
  [verifySysUserAccessToken, verifyPermissions("PRODUCTS")],
  body("id")
    .notEmpty()
    .withMessage("El id es obligatorio")
    .isString()
    .withMessage("El id debe ser una cadena"),
  enableProduct
);

router.put(
  "/unavailable",
  [
    verifySysUserAccessToken,
    verifyPermissions("PRODUCTS"),
    body("id")
      .notEmpty()
      .withMessage("El id es obligatorio")
      .isString()
      .withMessage("El id debe ser una cadena"),
  ],
  unavailableProduct
);

router.put(
  "/available",
  [
    verifySysUserAccessToken,
    verifyPermissions("PRODUCTS"),
    body("id")
      .notEmpty()
      .withMessage("El id es obligatorio")
      .isString()
      .withMessage("El id debe ser una cadena"),
  ],
  availableProduct
);

export default router;
