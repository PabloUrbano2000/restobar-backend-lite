import { Router } from "express";
import { verifySysUserAccessToken } from "../middlewares";
import { getList } from "../controllers/category.controller";

const router = Router();

router.get("/list", [verifySysUserAccessToken], getList);

export default router;
