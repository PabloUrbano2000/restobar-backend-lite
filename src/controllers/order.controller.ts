import { Request, Response } from "express";
import { RequestServer } from "../interfaces/Request";
import { ErrorFormat } from "../interfaces/Error";
import { validationResult } from "express-validator";
import { USER_COLLECTION, User, UserToken } from "../models/User";
import { RECEPTION_COLLECTION } from "../models/Reception";
import {
  DOCUMENT_TYPE_COLLECTION,
  DocumentTypeDB,
} from "../models/DocumentType";
import {
  ORDER_COLLECTION,
  ORDER_DETAILS_COLLECTION,
  OrderDetail,
  OrderLine,
  OrderStatus,
} from "../models/Order";
import { PRODUCT_COLLECTION, Product } from "../models/Product";
import { generateUTCToLimaDate } from "../helpers/generators";
import { DocumentReference, DocumentData } from "firebase/firestore";

const createClientOrder = async (request: Request, res: Response) => {
  const req = request as RequestServer;
  let errors: ErrorFormat[] = [];
  const resultValidator = validationResult(req);

  if (!resultValidator.isEmpty()) {
    errors = resultValidator.array().map((data) => data.msg);

    return res.status(400).json({
      status_code: 400,
      error_code: "INVALID_BODY_FIELDS",
      errors,
    });
  }

  try {
    const accessToken = request.headers["x-access-token"]?.toString() || "";

    const userFound: User | null = await req.firebase.getDocumentById(
      USER_COLLECTION,
      req.userId
    );
    if (!userFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_FOUND",
        errors: ["Usuario no existente"],
      });
    }

    if (userFound.id !== req.userId) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    if (!userFound.tokens || userFound.tokens?.length === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    const hasAccessToken = userFound?.tokens?.some(
      (token: UserToken) => token.access_token === accessToken
    );

    if (!hasAccessToken) {
      return res.status(401).json({
        status_code: 401,
        error_code: "INVALID_TOKEN",
        errors: ["Token inválido"],
      });
    }

    if (userFound.verified === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_VERIFIED",
        errors: ["Cuenta aún no verificada, por favor valide su cuenta"],
      });
    }

    if (userFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_NOT_ENABLED",
        errors: ["El usuario está deshabilitado"],
      });
    }

    const {
      reception = undefined,
      user_document_number = undefined,
      order_type = undefined,
      payment_method = undefined,
      order_channel = undefined,
      items = [],
    } = req.body;

    const receptionFound = await req.firebase.getDocumentById(
      RECEPTION_COLLECTION,
      reception
    );

    if (!receptionFound) {
      return res.status(400).json({
        status_code: 400,
        error_code: "RECEPTION_NOT_FOUND",
        messages: ["Recepción no existente"],
      });
    }

    if (receptionFound?.status === 0) {
      return res.status(400).json({
        status_code: 400,
        error_code: "RECEPTION_IS_DISABLED",
        messages: ["La recepción no se encuentra disponible"],
      });
    }

    if (receptionFound?.available === 0) {
      return res.status(400).json({
        status_code: 400,
        error_code: "RECEPTION_IS_UNAVAILABLE",
        messages: ["La recepción ya se encuentra reservada"],
      });
    }

    // generamos el nro de orden
    const documentOrderFound: DocumentTypeDB | null =
      await req.firebase.getOneDocument(DOCUMENT_TYPE_COLLECTION, [
        ["name", "==", "Orden"],
      ]);
    if (!documentOrderFound) {
      return res.status(400).json({
        status_code: 400,
        error_code: "DOCUMENT_NOT_FOUND",
        messages: ["Tipo de documento orden no existente"],
      });
    }

    let serie = "";
    const initialSequential = (documentOrderFound?.sequential || 0) + 1;
    const lengthSecuential = initialSequential.toString();
    const serial = lengthSecuential.length;
    const resultLength = (documentOrderFound?.length || 8) - serial;
    for (let index = 0; index < resultLength; index++) {
      serie = serie + "0";
    }
    serie = documentOrderFound.code + "-" + serie + lengthSecuential;
    documentOrderFound.sequential = initialSequential;

    // verificamos si los id's de los productos son autenticos
    const productsId: string[] = [];
    const productsData: Promise<Product | null>[] = [];

    for (let item of items) {
      if (item.product && !productsId.includes(item.product)) {
        productsId.push(item.product);
        productsData.push(
          req.firebase.getDocumentById(PRODUCT_COLLECTION, item.product)
        );
      }
    }

    const productsResult = await Promise.all(productsData);

    if (productsResult.includes(null)) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCTS_NOT_FOUND",
        errors: ["Producto(s) no existente(s)"],
      });
    }

    // verificamos la existencia de los productos
    productsResult.forEach((prod) => {
      if (
        typeof prod?.available === undefined ||
        prod?.available === 0 ||
        typeof prod?.status === undefined ||
        prod?.status === 0
      ) {
        return res.status(401).json({
          status_code: 401,
          error_code: "PRODUCTS_IS_UNAVAILABLE",
          errors: ["Producto(s) no disponible(s)"],
        });
      }
    });

    // generamos los cálculos
    const tax = 0.18;
    let subtotal = 0;
    let total = 0;
    items.forEach((od: any) => {
      const product = productsResult.find((val) => val?.id === od.product);
      subtotal = subtotal + (product?.price || 0) * od.quantity;
    });

    subtotal = Number(subtotal.toFixed(2));

    total = Number((subtotal * (1 + tax)).toFixed(2));

    // actualizamos el valor de la mesa a no disponible
    const { id: receptionId, ...restRec } = receptionFound;
    await req.firebase.updateDocumentById(
      RECEPTION_COLLECTION,
      receptionFound.id || "",
      {
        ...restRec,
        available: 0,
      }
    );

    // guardamos el valor del nuevo número de orden
    const { id: docId, ...restDoc } = documentOrderFound;
    await req.firebase.updateDocumentById(
      DOCUMENT_TYPE_COLLECTION,
      documentOrderFound.id || "",
      {
        ...restDoc,
      }
    );

    // generamos la orden
    const userReference = req.firebase.instanceReferenceById(
      USER_COLLECTION,
      userFound.id || ""
    );

    const receptionReference = req.firebase.instanceReferenceById(
      RECEPTION_COLLECTION,
      reception || ""
    );

    const newOrder = await req.firebase.insertDocument(ORDER_COLLECTION, {
      client: userReference,
      order_number: serie,
      order_type,
      status: OrderStatus.PENDING,
      user_document_number,
      reception: receptionReference,
      reception_date: generateUTCToLimaDate(),
      payment_method,
      tax,
      subtotal,
      total,
      order_channel,
      items: [],
    });

    // generamos el detalle de la orden
    const orderLines = items.map((od: OrderLine) =>
      req.firebase.insertDocument(ORDER_DETAILS_COLLECTION, {
        order: req.firebase.instanceReferenceById(
          ORDER_COLLECTION,
          newOrder.id
        ),
        product: req.firebase.instanceReferenceById(
          PRODUCT_COLLECTION,
          od.product
        ),
        price_of_sale:
          productsResult.find((res) => res?.id === od.product)?.price || 0,
        quantity: od.quantity,
      })
    );

    let orderLinesResult = [];
    let orderLinesReferences: DocumentReference<DocumentData, DocumentData>[] =
      [];

    try {
      orderLinesResult = await Promise.all(orderLines);
      orderLinesResult.forEach((res) =>
        orderLinesReferences.push(
          req.firebase.instanceReferenceById(ORDER_DETAILS_COLLECTION, res.id)
        )
      );
    } catch (error) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ITEMS_NOT_REGISTERED",
        errors: ["Ocurrió un error al generar el detalle de la orden"],
      });
    }

    // buscamos la orden para actualizarle los items
    const orderFound = await req.firebase.getDocumentById(
      ORDER_COLLECTION,
      newOrder.id
    );

    const { id: orderId, ...rest } = orderFound;

    await req.firebase.updateDocumentById(ORDER_COLLECTION, newOrder.id, {
      ...rest,
      items: orderLinesReferences,
    });

    const newOrderFound = await req.firebase.getDocumentById(
      ORDER_COLLECTION,
      orderId
    );

    newOrderFound.reception_date = new Date(
      newOrderFound?.reception_date?.seconds * 1000
    );

    newOrderFound.client = await req.firebase.getObjectByReference(
      newOrderFound.client
    );

    newOrderFound.client = req.firebase.showValuesDocument(
      newOrderFound.client,
      ["id", "first_name", "last_name", "second_last_name"]
    );

    newOrderFound.reception = await req.firebase.getObjectByReference(
      newOrderFound.reception
    );

    newOrderFound.reception = req.firebase.showValuesDocument(
      newOrderFound.reception,
      ["id", "number_table", "code"]
    );

    const cleanOrder = req.firebase.cleanValuesDocument(newOrderFound, [
      "items",
    ]);

    // const itemsFound = newOrderFound.items.map((item: any) =>
    //   req.firebase.getObjectByReference(item)
    // );

    // newOrderFound.items = await Promise.all(itemsFound);

    // newOrderFound.items = newOrderFound.items.map((item)=> req.firebase)

    return res.status(200).json({
      status_code: 200,
      data: {
        order: cleanOrder,
      },
      message: `Pedido ${serie} registrado éxitosamente`,
      errors: [],
    });
  } catch (error) {
    console.log("order create-client-order response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export { createClientOrder };
