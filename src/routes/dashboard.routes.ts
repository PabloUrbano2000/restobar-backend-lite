import { Router } from "express";
import { verifySysUserAccessToken } from "../middlewares";
import {
  getReceptionsWithRequiresAttentionList,
  serveReception,
} from "../controllers/dashboard.controller";

const router = Router();

router.post(
  "/receptions",
  [verifySysUserAccessToken],
  getReceptionsWithRequiresAttentionList
);
router.post("/serve-reception", [verifySysUserAccessToken], serveReception);

export default router;
