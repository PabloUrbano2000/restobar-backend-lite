import { Router } from "express";
import { verifySysUserAccessToken, verifyPermissions } from "../middlewares";
import { getList } from "../controllers/systemUser.controller";

const router = Router();

router.post("/list", [verifySysUserAccessToken, verifyPermissions("SYSTEM_USERS")], getList);

export default router;
