import { Router } from "express";
import { getPublicList as getCategoryList } from "../controllers/category.controller";
import { getPublicList as getGenderList } from "../controllers/gender.controller";
import { getPublicList as getDocumentTypeList } from "../controllers/documentType.controller";
import { getPublicList as getReceptionList } from "../controllers/reception.controller";
import {
  getPublicList as getProductList,
  getPublicProduct,
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
  getPublicProduct
);

export default router;
