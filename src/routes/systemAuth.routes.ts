import { Router } from "express";
import { body } from "express-validator";
import {
  login,
  renewToken,
  recoveryAccount,
  verifyAccount,
  verifyPassword,
  recoveryPassword,
  changePassword,
  verifyAccessToken,
  logout,
  register,
} from "../controllers/systemAuth.controller";
import {
  verifySysUserValidToken,
  verifySysUserAccessToken,
  verifySysUserRefreshToken,
} from "../middlewares";
import { namesRegex } from "../utilities/regex";

const router = Router();

router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("El correo electrónico es obligatorio")
      .isEmail()
      .withMessage("Correo electrónico con formato inválido"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  login
);

router.post(
  "/token/renew",
  [verifySysUserAccessToken, verifySysUserRefreshToken],
  renewToken
);

router.post("/token/verify", [verifySysUserAccessToken], verifyAccessToken);

router.post(
  "/account/recovery",
  [
    body("email")
      .notEmpty()
      .withMessage("El correo electrónico es obligatorio")
      .isEmail()
      .withMessage("Correo electrónico con formato inválido"),
  ],
  recoveryAccount
);

router.post("/account/verify", [verifySysUserValidToken], verifyAccount);

// verificación del token del usuario de sistema
router.post("/password/verify", [verifySysUserValidToken], verifyPassword);

// enviar token para recuperar la cuenta
router.post(
  "/password/recovery",
  [
    body("email")
      .notEmpty()
      .withMessage("El correo electrónico es obligatorio")
      .isEmail()
      .withMessage("Correo electrónico con formato inválido"),
  ],
  recoveryPassword
);

// guardar contraseña con el token generado
router.post(
  "/password/change",
  [
    verifySysUserValidToken,
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
  changePassword
);

router.post("/logout", [verifySysUserAccessToken], logout);

router.post(
  "/create",
  [
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
  register
);

export default router;
