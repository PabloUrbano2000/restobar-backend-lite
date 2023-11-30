import { Router } from "express";
import { verifySysUserAccessToken, verifyPermissions } from "../middlewares";
import {
  createSystemUser,
  getList,
  getSystemUser,
  updateSystemUser,
  disableSystemUser,
  enableSystemUser,
} from "../controllers/systemUser.controller";
import { body } from "express-validator";
import { namesRegex } from "../utilities/regex";

const router = Router();

router.post(
  "/list",
  [verifySysUserAccessToken, verifyPermissions("SYSTEM_USERS")],
  getList
);
router.post(
  "/get",
  [
    verifySysUserAccessToken,
    verifyPermissions("SYSTEM_USERS"),
    body("id").notEmpty().withMessage("El id del usuario es obligatorio"),
  ],
  getSystemUser
);

router.post(
  "/create",
  [
    verifySysUserAccessToken,
    verifyPermissions("SYSTEM_USERS"),
    body("first_name")
      .notEmpty()
      .withMessage("El nombre es obligatorio")
      .isString()
      .withMessage("El nombre debe ser una cadena")
      .isLength({ min: 2, max: 50 })
      .withMessage("El nombre debe tener entre 2 a 50 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!namesRegex.test(data.toString())) {
            throw Error("Nombre con formato inválido");
          }
        }
        return true;
      }),
    body("last_name")
      .notEmpty()
      .withMessage("El apellido paterno es obligatorio")
      .isString()
      .withMessage("El apellido paterno debe ser una cadena")
      .isLength({ min: 2, max: 50 })
      .withMessage("El apellido paterno debe tener entre 2 a 50 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!namesRegex.test(data.toString())) {
            throw Error("Apellido paterno con formato inválido");
          }
        }
        return true;
      }),
    body("email")
      .notEmpty()
      .withMessage("El correo electrónico es obligatorio")
      .isEmail()
      .withMessage("Correo electrónico con formato inválido"),
    body("role")
      .notEmpty()
      .withMessage("El rol es obligatorio")
      .isString()
      .withMessage("El rol debe ser una cadena"),
  ],
  createSystemUser
);

router.put(
  "/update",
  [
    verifySysUserAccessToken,
    verifyPermissions("SYSTEM_USERS"),
    body("id")
      .notEmpty()
      .withMessage("El id es obligatorio")
      .isString()
      .withMessage("El id debe ser una cadena"),
    body("first_name")
      .optional()
      .isString()
      .withMessage("El nombre debe ser una cadena")
      .isLength({ min: 2, max: 50 })
      .withMessage("El nombre debe tener entre 2 a 50 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!namesRegex.test(data.toString())) {
            throw Error("Nombre con formato inválido");
          }
        }
        return true;
      }),
    body("last_name")
      .optional()
      .isString()
      .withMessage("El apellido paterno debe ser una cadena")
      .isLength({ min: 2, max: 50 })
      .withMessage("El apellido paterno debe tener entre 2 a 50 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!namesRegex.test(data.toString())) {
            throw Error("Apellido paterno con formato inválido");
          }
        }
        return true;
      }),
    body("role")
      .optional()
      .isString()
      .withMessage("El rol debe ser una cadena")
      .isLength({ min: 2, max: 50 })
      .withMessage("El rol es inválido"),
  ],
  updateSystemUser
);

router.put(
  "/disable",
  [
    verifySysUserAccessToken,
    verifyPermissions("SYSTEM_USERS"),
    body("id")
      .notEmpty()
      .withMessage("El id es obligatorio")
      .isString()
      .withMessage("El id debe ser una cadena"),
  ],
  disableSystemUser
);

router.put(
  "/enable",
  [
    verifySysUserAccessToken,
    verifyPermissions("SYSTEM_USERS"),
    body("id")
      .notEmpty()
      .withMessage("El id es obligatorio")
      .isString()
      .withMessage("El id debe ser una cadena"),
  ],
  enableSystemUser
);

export default router;
