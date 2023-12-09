import { Router } from "express";
import { verifyPermissions, verifySysUserAccessToken } from "../middlewares";
import {
  getList,
  getOrder,
  inProcessOrder,
  terminateOrder,
} from "../controllers/order.controller";
import { body } from "express-validator";

const router = Router();

router.post(
  "/list",
  [verifySysUserAccessToken, verifyPermissions("ORDERS")],
  getList
);

router.post(
  "/get",
  [
    verifySysUserAccessToken,
    verifyPermissions("ORDERS"),
    body("id")
      .notEmpty()
      .withMessage("El id de la orden es obligatorio")
      .isString()
      .withMessage("El id de la orden debe ser una cadena"),
  ],
  getOrder
);

router.put(
  "/in-process",
  [verifySysUserAccessToken, verifyPermissions("ORDERS")],
  [
    body("id")
      .notEmpty()
      .withMessage("El id de la orden es obligatorio")
      .isString()
      .withMessage("El id de la orden debe ser una cadena"),
    body("estimated_time")
      .notEmpty()
      .withMessage("El tiempo estimado es obligatorio")
      .custom((data) => {
        if (typeof data !== "number") {
          throw Error("El tiempo estimado debe ser un número");
        }
        return true;
      })
      .isInt({ min: 1, max: 60 })
      .withMessage("El tiempo estimado debe estar entre 1 a 60 minutos"),
  ],
  inProcessOrder
);

router.put(
  "/terminate",
  [verifySysUserAccessToken, verifyPermissions("ORDERS")],
  body("id")
    .notEmpty()
    .withMessage("El id de la orden es obligatorio")
    .isString()
    .withMessage("El id de la orden debe ser una cadena"),
  terminateOrder
);

export default router;
