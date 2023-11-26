import { Router } from "express";
import { verifySysUserAccessToken } from "../middlewares";
import { getList } from "../controllers/documentType.controller";

const router = Router();

router.get("/list", [verifySysUserAccessToken], getList);

export default router;
