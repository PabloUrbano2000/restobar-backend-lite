import { Router } from "express";

import {
  getSystemUserProfile,
  updateSystemUserProfile,
  changePasswordSystemUser,
} from "../controllers/profile.controller";

import { verifySysUserAccessToken } from "../middlewares";
import { body } from "express-validator";
import { namesRegex } from "../utilities/regex";

const router = Router();

router.post("/get", [verifySysUserAccessToken], getSystemUserProfile);
router.put(
  "/update",
  [
    verifySysUserAccessToken,
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
    body("second_last_name")
      .optional()
      .isString()
      .withMessage("El apellido materno debe ser una cadena")
      .isLength({ min: 2, max: 50 })
      .withMessage("El apellido materno debe tener entre 2 a 50 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!namesRegex.test(data.toString())) {
            throw Error("Apellido materno con formato inválido");
          }
        }
        return true;
      }),
  ],
  updateSystemUserProfile
);

router.put(
  "/password/change",
  [
    verifySysUserAccessToken,
    body("current_password")
      .notEmpty()
      .withMessage("La contraseña actual es obligatoria"),
    body("new_password")
      .notEmpty()
      .withMessage("La nueva contraseña es obligatoria")
      .isLength({ min: 8, max: 16 })
      .withMessage("La nueva contraseña debe tener entre 8 a 16 caracteres"),
    body("confirm_password")
      .notEmpty()
      .withMessage("La confirmación de la contraseña es obligatoria")
      .isLength({ min: 8, max: 16 })
      .withMessage(
        "La confirmación de contraseña debe tener entre 8 a 16 caracteres"
      )
      .custom((data, { req }) => {
        if (data && data !== req.body.new_password) {
          throw Error("Las contraseñas deben ser idénticas");
        }
        return true;
      }),
  ],
  changePasswordSystemUser
);



export default router;
