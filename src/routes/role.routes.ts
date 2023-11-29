import { Router } from "express";
import { verifyPermissions, verifySysUserAccessToken } from "../middlewares";
import { getList } from "../controllers/role.controller";

const router = Router();

router.get(
  "/list",
  [verifySysUserAccessToken, verifyPermissions("ROLES")],
  getList
);

export default router;
