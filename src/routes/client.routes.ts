import { Router } from "express";
import { getPublicList as getCategoryList } from "../controllers/category.controller";
import { getPublicList as getGenderList } from "../controllers/gender.controller";
import { getPublicList as getDocumentTypeList } from "../controllers/documentType.controller";
import { getPublicList as getReceptionList } from "../controllers/reception.controller";
import { verifyUserAccessToken } from "../middlewares";

const router = Router();

router.get("/category/list", [verifyUserAccessToken], getCategoryList);
router.get("/gender/list", [verifyUserAccessToken], getGenderList);
router.get("/document-type/list", [verifyUserAccessToken], getDocumentTypeList);
router.get("/reception/list", [verifyUserAccessToken], getReceptionList);

export default router;
