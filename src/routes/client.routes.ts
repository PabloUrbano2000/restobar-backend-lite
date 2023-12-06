import { Router } from "express";
import { getClientList as getCategoryList } from "../controllers/category.controller";
import { getClientList as getGenderList } from "../controllers/gender.controller";
import { getClientList as getDocumentTypeList } from "../controllers/documentType.controller";
import { getClientList as getReceptionList } from "../controllers/reception.controller";
import { getClientProfile } from "../controllers/profile.controller";
import {
  getClientList as getProductList,
  getClientProduct,
} from "../controllers/product.controller";
import { verifyUserAccessToken } from "../middlewares";
import { body } from "express-validator";

const router = Router();

router.post("/category/list", [verifyUserAccessToken], getCategoryList);
router.post("/gender/list", [verifyUserAccessToken], getGenderList);
router.post(
  "/document-type/list",
  [verifyUserAccessToken],
  getDocumentTypeList
);
router.post("/reception/list", [verifyUserAccessToken], getReceptionList);

router.post("/product/list", [verifyUserAccessToken], getProductList);
router.post(
  "/product/get",
  [
    verifyUserAccessToken,
    body("id")
      .notEmpty()
      .withMessage("El id es obligatorio")
      .isString()
      .withMessage("El id debe ser una cadena"),
  ],
  getClientProduct
);

router.post("/profile/get", [verifyUserAccessToken], getClientProfile);

export default router;
