import { Router } from "express";
import { getClientList as getCategoryList } from "../controllers/category.controller";
import { getClientList as getGenderList } from "../controllers/gender.controller";
import { getClientList as getDocumentTypeList } from "../controllers/documentType.controller";
import { getClientList as getReceptionList } from "../controllers/reception.controller";
import {
  createClientOrder,
  getClientOrder,
  getClientList as getOrderList,
} from "../controllers/order.controller";
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
import {
  OrderChannel,
  OrderLine,
  OrderType,
  PaymentMethod,
} from "../models/Order";

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
      .withMessage("El id del producto es obligatorio")
      .isString()
      .withMessage("El id del producto debe ser una cadena"),
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

router.post(
  "/order/register",
  [
    verifyUserAccessToken,
    body("reception")
      .notEmpty()
      .withMessage("El id de la recepción es obligatorio")
      .isString()
      .withMessage("El id de la recepción debe ser una cadena"),
    body("user_document_number")
      .notEmpty()
      .withMessage("El número de documento del cliente es obligatorio")
      .isString()
      .withMessage("El número de documento del cliente debe ser una cadena")
      .isLength({ min: 8, max: 20 })
      .withMessage(
        "El número de documento del cliente debe tener entre 8 a 20 caracteres"
      ),
    body("order_type")
      .notEmpty()
      .withMessage("El tipo de orden es obligatorio")
      .isString()
      .withMessage("El tipo de orden debe ser una cadena")
      .custom((data: string) => {
        if (data) {
          if (data !== OrderType.IN_LOCAL && data !== OrderType.TAKEAWAY) {
            throw Error("Tipo de orden con formato inválido");
          }
        }
        return true;
      }),
    body("payment_method")
      .notEmpty()
      .withMessage("El método de pago es obligatorio")
      .isString()
      .withMessage("El método de pago debe ser una cadena")
      .custom((data: string) => {
        if (data) {
          if (
            data !== PaymentMethod.CASH &&
            data !== PaymentMethod.VISA &&
            data !== PaymentMethod.MASTERCARD
          ) {
            throw Error("Método de pago con formato inválido");
          }
        }
        return true;
      }),
    body("order_channel")
      .notEmpty()
      .withMessage("El canal de venta es obligatorio")
      .isString()
      .withMessage("El canal de venta debe ser una cadena")
      .custom((data: string) => {
        if (data) {
          if (data !== OrderChannel.APP) {
            throw Error("Canal de venta con formato inválido");
          }
        }
        return true;
      }),
    body("items")
      .notEmpty()
      .withMessage("Los productos son obligatorios")
      .isArray({
        min: 1,
        max: 10,
      })
      .withMessage(
        "Debe haber mínimo un tipo de producto y máximo 10 por pedido"
      )
      .custom((data: OrderLine[]) => {
        if (data?.length > 0) {
          const auxData: string[] = [];
          data.forEach((item) => {
            if (!item.product || typeof item.product !== "string") {
              throw Error("Item(s) con formato inválido");
            }
            if (
              !item.quantity ||
              typeof item.quantity !== "number" ||
              item.quantity.toString().includes(".")
            ) {
              throw Error("Item(s) con formato inválido");
            }
            if (item.quantity > 10 || item.quantity < 1) {
              throw Error("La cantidad mínima de un item es 1 y máximo 10");
            }
            if (auxData.includes(item.product)) {
              throw Error(
                "No se aceptan items con id's de productos duplicados"
              );
            } else {
              auxData.push(item.product);
            }
          });
        }
        return true;
      }),
  ],
  createClientOrder
);

router.post(
  "/order/get",
  [
    verifyUserAccessToken,
    body("id")
      .notEmpty()
      .withMessage("El id de la orden es obligatorio")
      .isString()
      .withMessage("El id de la orden debe ser una cadena"),
  ],
  getClientOrder
);

router.post("/order/list", [verifyUserAccessToken], getOrderList);

export default router;
