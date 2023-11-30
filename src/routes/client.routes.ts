import { Router } from "express";
import { getPublicList as getCategoryList } from "../controllers/category.controller";
import { getPublicList as getGenderList } from "../controllers/gender.controller";
import { getPublicList as getDocumentTypeList } from "../controllers/documentType.controller";
import { getPublicList as getReceptionList } from "../controllers/reception.controller";
import { verifyUserAccessToken } from "../middlewares";

const router = Router();

router.post("/category/list", [verifyUserAccessToken], getCategoryList);
router.post("/gender/list", [verifyUserAccessToken], getGenderList);
router.post(
  "/document-type/list",
  [verifyUserAccessToken],
  getDocumentTypeList
);
router.post("/reception/list", [verifyUserAccessToken], getReceptionList);

export default router;
