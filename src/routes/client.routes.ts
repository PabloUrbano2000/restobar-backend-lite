import { Router } from "express";
import { getClientList as getCategoryList } from "../controllers/category.controller";
import { getClientList as getGenderList } from "../controllers/gender.controller";
import { getClientList as getDocumentTypeList } from "../controllers/documentType.controller";
import { getClientList as getReceptionList } from "../controllers/reception.controller";
import {
  changePasswordUser,
  getClientProfile,
  updateUserProfile,
} from "../controllers/profile.controller";
import {
  getClientList as getProductList,
  getClientProduct,
} from "../controllers/product.controller";
import { isValidDocumentType, verifyUserAccessToken } from "../middlewares";
import { body } from "express-validator";
import { cellphoneRegex, descripRegex, namesRegex } from "../utilities/regex";

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

router.put(
  "/profile/update",
  [
    verifyUserAccessToken,
    body("first_name")
      .optional()
      .isString()
      .withMessage("El nombre debe ser una cadena")
      .isLength({ min: 2, max: 50 })
      .withMessage("El nombre debe tener entre 2 a 50 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!namesRegex.test(data.toString())) {
            throw Error("Nombre con formato inválido");
          }
        }
        return true;
      }),
    body("last_name")
      .optional()
      .isString()
      .withMessage("El apellido paterno debe ser una cadena")
      .isLength({ min: 2, max: 50 })
      .withMessage("El apellido paterno debe tener entre 2 a 50 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!namesRegex.test(data.toString())) {
            throw Error("Apellido paterno con formato inválido");
          }
        }
        return true;
      }),
    body("second_last_name")
      .optional()
      .isString()
      .withMessage("El apellido materno debe ser una cadena")
      .isLength({ min: 2, max: 50 })
      .withMessage("El apellido materno debe tener entre 2 a 50 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!namesRegex.test(data.toString())) {
            throw Error("Apellido materno con formato inválido");
          }
        }
        return true;
      }),

    body("document_type")
      .optional()
      .isString()
      .withMessage("El tipo de documento debe ser una cadena")
      .isLength({ min: 2, max: 20 })
      .withMessage("El tipo de documento debe tener entre 2 a 20 caracteres"),
    body("document_number")
      .optional()
      .isString()
      .withMessage("El número de documento debe ser una cadena")
      .isLength({ min: 8, max: 20 })
      .withMessage("El número de documento debe tener entre 8 a 20 caracteres"),
    body().custom((_: string, { req }) => {
      const { document_type, document_number } = req.body;
      if (
        typeof document_type === "string" &&
        document_type.length >= 2 &&
        document_type.length <= 20 &&
        typeof document_number === "string" &&
        document_number.length >= 8 &&
        document_number.length <= 20
      ) {
        return isValidDocumentType({
          req,
          documentType: document_type,
          documentNumber: document_number,
        });
      }
      return true;
    }),
    body("cellphone_number")
      .optional()
      .isString()
      .withMessage("El número telefónico debe ser una cadena")
      .isLength({ min: 9, max: 9 })
      .withMessage("El número telefónico debe tener 9 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!cellphoneRegex.test(data.toString())) {
            throw Error("Número teléfonico con formato inválido");
          }
        }
        return true;
      }),
    body("address")
      .optional()
      .isString()
      .withMessage("La dirección debe ser una cadena")
      .isLength({ min: 2, max: 100 })
      .withMessage("La dirección debe tener 2 a 100 caracteres")
      .custom((data: string) => {
        if (data) {
          if (!descripRegex.test(data.toString())) {
            throw Error("Dirección con formato inválido");
          }
        }
        return true;
      }),
    body("gender")
      .optional()
      .isString()
      .withMessage("El género debe ser una cadena")
      .isLength({ min: 2, max: 50 })
      .withMessage("El género es inválido"),
  ],
  updateUserProfile
);

router.put(
  "/profile/password/change",
  [
    verifyUserAccessToken,
    body("current_password")
      .notEmpty()
      .withMessage("La contraseña actual es obligatoria"),
    body("new_password")
      .notEmpty()
      .withMessage("La nueva contraseña es obligatoria")
      .isLength({ min: 8, max: 16 })
      .withMessage("La nueva contraseña debe tener entre 8 a 16 caracteres"),
    body("confirm_password")
      .notEmpty()
      .withMessage("La confirmación de la contraseña es obligatoria")
      .isLength({ min: 8, max: 16 })
      .withMessage(
        "La confirmación de contraseña debe tener entre 8 a 16 caracteres"
      )
      .custom((data, { req }) => {
        if (data && data !== req.body.new_password) {
          throw Error("Las contraseñas deben ser idénticas");
        }
        return true;
      }),
  ],
  changePasswordUser
);

export default router;
