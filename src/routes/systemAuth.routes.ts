import { Router } from "express";
import { body } from "express-validator";
import {
  login,
  //   renewToken,
  //   sentRecovery,
  //   verifyToken,
  //   changePassword,
} from "../controllers/systemAuth.controller";

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

// router.post("/token/renew", renewToken);

// router.post("/token/verify", verifyToken);

// router.post("/password/recovery", sentRecovery);

// router.post("/password/change", changePassword);

export default router;
