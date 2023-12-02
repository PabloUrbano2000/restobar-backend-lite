import { Router } from "express";
import { body } from "express-validator";
import {
  login,
  renewToken,
  verifyAccessToken,
  recoveryAccount,
  verifyAccount,
  verifyPassword,
  recoveryPassword,
  changePassword,
  logoutAllSessions,
  logoutAllSessionsExceptCurrentOne,
  logoutCurrentSession,
  createUser,
} from "../controllers/auth.controller";
import {
  verifyUserValidToken,
  verifyUserAccessToken,
  verifyUserRefreshToken,
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
      .withMessage("Correo electrónico con formato inválido")
      .escape(),
    body("password")
      .notEmpty()
      .withMessage("La contraseña es obligatoria")
      .escape(),
  ],
  login
);

router.post(
  "/register",
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
    body("second_last_name")
      .notEmpty()
      .withMessage("El apellido materno es obligatorio")
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
    body("email")
      .notEmpty()
      .withMessage("El correo electrónico es obligatorio")
      .isEmail()
      .withMessage("Correo electrónico con formato inválido"),
    body("password")
      .notEmpty()
      .withMessage("La contraseña es obligatoria")
      .isString()
      .withMessage("La contraseña debe ser una cadena")
      .isLength({ min: 8, max: 16 })
      .withMessage("La contraseña debe tener entre 8 a 16 caracteres"),
  ],
  createUser
);

router.post(
  "/token/renew",
  [verifyUserAccessToken, verifyUserRefreshToken],
  renewToken
);

router.post("/token/verify", [verifyUserAccessToken], verifyAccessToken);

router.post(
  "/account/recovery",
  [
    body("email")
      .notEmpty()
      .withMessage("El correo electrónico es obligatorio")
      .isEmail()
      .withMessage("Correo electrónico con formato inválido")
      .escape(),
  ],
  recoveryAccount
);

router.post("/account/verify", [verifyUserValidToken], verifyAccount);

// verificación del token del usuario de sistema
router.post("/password/verify", [verifyUserValidToken], verifyPassword);

// enviar token para recuperar la cuenta
router.post(
  "/password/recovery",
  [
    body("email")
      .notEmpty()
      .withMessage("El correo electrónico es obligatorio")
      .isEmail()
      .withMessage("Correo electrónico con formato inválido")
      .escape(),
  ],
  recoveryPassword
);

// guardar contraseña con el token generado
router.post(
  "/password/change",
  [
    verifyUserValidToken,
    body("new_password")
      .notEmpty()
      .withMessage("La nueva contraseña es obligatoria")
      .isLength({ min: 8, max: 16 })
      .withMessage("La nueva contraseña debe tener entre 8 a 16 caracteres")
      .escape(),
    body("confirm_password")
      .notEmpty()
      .withMessage("La confirmación de la contraseña es obligatoria")
      .isLength({ min: 8, max: 16 })
      .withMessage(
        "La confirmación de contraseña debe tener entre 8 a 16 caracteres"
      )
      .escape()
      .custom((data, { req }) => {
        if (data && data !== req.body.new_password) {
          throw Error("Las contraseñas deben ser idénticas");
        }
        return true;
      }),
  ],
  changePassword
);

router.post("/logout/current", [verifyUserAccessToken], logoutCurrentSession);
router.post("/logout/all", [verifyUserAccessToken], logoutAllSessions);
router.post(
  "/logout/all/except-current",
  [verifyUserAccessToken],
  logoutAllSessionsExceptCurrentOne
);

export default router;
