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
} from "../controllers/systemAuth.controller";
import {
  verifySysUserValidToken,
  verifySysUserAccessToken,
  verifySysUserRefreshToken,
} from "../middlewares";

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

export default router;
