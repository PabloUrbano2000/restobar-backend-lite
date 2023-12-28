import { Router } from "express";
import { verifySysUserAccessToken } from "../middlewares";
import {
  getReceptionsWithRequiresAttentionList,
  serveReception,
} from "../controllers/dashboard.controller";
import { body } from "express-validator";

const router = Router();

router.post(
  "/receptions",
  [verifySysUserAccessToken],
  getReceptionsWithRequiresAttentionList
);
router.post(
  "/serve-reception",
  [
    verifySysUserAccessToken,
    body("id")
      .notEmpty()
      .withMessage("El id de la recepción es obligatorio")
      .isString()
      .withMessage("El id de la recepción debe ser una cadena"),
  ],
  serveReception
);

export default router;
