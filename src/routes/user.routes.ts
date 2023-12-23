import { Router } from "express";
import { verifySysUserAccessToken, verifyPermissions } from "../middlewares";
import { getList, getUser } from "../controllers/user.controller";
import { body } from "express-validator";

const router = Router();

router.post(
  "/list",
  [verifySysUserAccessToken, verifyPermissions("USERS")],
  getList
);

router.post(
  "/get",
  [
    verifySysUserAccessToken,
    verifyPermissions("USERS"),
    body("id")
      .notEmpty()
      .withMessage("El id del cliente es obligatorio")
      .isString()
      .withMessage("El id del cliente debe ser una cadena"),
  ],
  getUser
);

export default router;
