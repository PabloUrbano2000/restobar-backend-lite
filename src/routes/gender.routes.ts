import { Router } from "express";
import { verifySysUserAccessToken } from "../middlewares";
import { getList } from "../controllers/gender.controller";

const router = Router();

router.post("/list", [verifySysUserAccessToken], getList);

export default router;
