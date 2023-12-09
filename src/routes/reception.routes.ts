import { Router } from "express";
import { verifyPermissions, verifySysUserAccessToken } from "../middlewares";
import {
  availableReception,
  createReception,
  disableReception,
  enableReception,
  getList,
  getReception,
  unavailableReception,
  updateReception,
} from "../controllers/reception.controller";
import { body } from "express-validator";

const router = Router();

router.post(
  "/list",
  [verifySysUserAccessToken, verifyPermissions("RECEPTIONS")],
  getList
);

router.post(
  "/get",
  [
    verifySysUserAccessToken,
    verifyPermissions("RECEPTIONS"),
    body("id")
      .notEmpty()
      .withMessage("El id de la recepción es obligatorio")
      .isString()
      .withMessage("El id de la recepción debe ser una cadena"),
  ],
  getReception
);

router.post(
  "/create",

  [
    verifySysUserAccessToken,
    verifyPermissions("RECEPTIONS"),
    body("number_table")
      .notEmpty()
      .withMessage("El número de mesa es obligatorio")
      .isString()
      .withMessage("El número de mesa debe ser una cadena")
      .custom((data: string) => {
        if (data) {
          if (!new RegExp(/^[0-9]{3,5}$/).test(data.toString())) {
            throw Error("Número de mesa con formato inválido");
          }
        }
        return true;
      }),
    body("code")
      .notEmpty()
      .withMessage("El código de mesa es obligatorio")
      .isString()
      .withMessage("El código de mesa debe ser una cadena")
      .custom((data: string) => {
        if (data) {
          if (!new RegExp(/^[R][0-9]{6,6}$/).test(data.toString())) {
            throw Error("Código de mesa con formato inválido");
          }
        }
        return true;
      }),
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
      .custom((data) => {
        if (data && typeof data !== "number") {
          throw Error("El estado debe ser un número");
        }
        return true;
      })
      .custom((data: string) => {
        if (data) {
          if (!new RegExp(/^(0|1)$/).test(data.toString())) {
            throw Error("Estado con formato inválido");
          }
        }
        return true;
      }),
  ],
  createReception
);

router.put(
  "/update",
  [verifySysUserAccessToken, verifyPermissions("RECEPTIONS")],
  body("id")
    .notEmpty()
    .withMessage("El id de la recepción es obligatorio")
    .isString()
    .withMessage("El id de la recepción debe ser una cadena"),
  body("number_table")
    .optional()
    .isString()
    .withMessage("El número de mesa debe ser una cadena")
    .custom((data: string) => {
      if (data) {
        if (!new RegExp(/^[0-9]{3,5}$/).test(data.toString())) {
          throw Error("Número de mesa con formato inválido");
        }
      }
      return true;
    }),
  body("code")
    .optional()
    .isString()
    .withMessage("El código de mesa debe ser una cadena")
    .custom((data: string) => {
      if (data) {
        if (!new RegExp(/^[R][0-9]{6,6}$/).test(data.toString())) {
          throw Error("Código de mesa con formato inválido");
        }
      }
      return true;
    }),
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
    .custom((data) => {
      if (data && typeof data !== "number") {
        throw Error("El estado debe ser un número");
      }
      return true;
    })
    .custom((data: string) => {
      if (data) {
        if (!new RegExp(/^(0|1)$/).test(data.toString())) {
          throw Error("Estado con formato inválido");
        }
      }
      return true;
    }),
  updateReception
);

router.put(
  "/disable",
  [verifySysUserAccessToken, verifyPermissions("RECEPTIONS")],
  body("id")
    .notEmpty()
    .withMessage("El id de la recepción es obligatorio")
    .isString()
    .withMessage("El id de la recepción debe ser una cadena"),
  disableReception
);

router.put(
  "/enable",
  [verifySysUserAccessToken, verifyPermissions("RECEPTIONS")],
  body("id")
    .notEmpty()
    .withMessage("El id de la recepción es obligatorio")
    .isString()
    .withMessage("El id de la recepción debe ser una cadena"),
  enableReception
);

router.put(
  "/unavailable",
  [
    verifySysUserAccessToken,
    verifyPermissions("RECEPTIONS"),
    body("id")
      .notEmpty()
      .withMessage("El id de la recepción es obligatorio")
      .isString()
      .withMessage("El id de la recepción debe ser una cadena"),
  ],
  unavailableReception
);

router.put(
  "/available",
  [
    verifySysUserAccessToken,
    verifyPermissions("RECEPTIONS"),
    body("id")
      .notEmpty()
      .withMessage("El id de la recepción es obligatorio")
      .isString()
      .withMessage("El id de la recepción debe ser una cadena"),
  ],
  availableReception
);

export default router;
