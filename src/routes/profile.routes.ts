import { Router } from "express";

import { getSystemUserProfile } from "../controllers/profile.controller";

import { verifySysUserAccessToken } from "../middlewares";

const router = Router();

router.post("/get", [verifySysUserAccessToken], getSystemUserProfile);

export default router;
