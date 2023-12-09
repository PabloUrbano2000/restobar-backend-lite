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
  OrderLine,
  OrderStatus,
} from "../models/Order";
import { Product } from "../models/Product";
import { generateUTCToLimaDate } from "../helpers/generators";
import {
  DocumentReference,
  DocumentData,
  FieldPath,
  WhereFilterOp,
} from "firebase/firestore";
import {
  sendMail,
  templateEmailOrderUserReceived,
  templateEmailOrderUserTerminated,
} from "../emails";
import {
  formatDatetoYYYYMMDD,
  formatDatetoYYYYMMDDHHmmSS,
} from "../helpers/formats";

const getList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  let {
    status = undefined,
    start_date = "",
    end_date = "",
    order_number = "",
    limit = 20,
    offset = 0,
  } = req.body;

  const filter: [
    fieldPath: string | FieldPath,
    opStr: WhereFilterOp,
    value: unknown
  ][] = [];

  let startDateFormat = new Date(
    formatDatetoYYYYMMDD(generateUTCToLimaDate(), "-")
  );
  let endDateFormat = new Date(
    formatDatetoYYYYMMDD(generateUTCToLimaDate(1), "-")
  );

  if (
    start_date &&
    /[1-2][0-9]{3}[-][0-1][0-9][-][0-3][0-9]/.test(start_date)
  ) {
    startDateFormat = new Date(start_date);
  }

  if (
    end_date &&
    start_date &&
    /[1-2][0-9]{3}[-][0-1][0-9][-][0-3][0-9]/.test(end_date)
  ) {
    endDateFormat = new Date(end_date);
    endDateFormat.setDate(endDateFormat.getDate() + 1);
  }

  filter.push(["reception_date", ">=", startDateFormat]);
  filter.push(["reception_date", "<", endDateFormat]);

  if (order_number) {
    filter.push(["order_number", "==", order_number]);
  }

  if (typeof status === "number") {
    filter.push(["status", "==", status]);
  }

  try {
    const result = await req.firebase.getDocumentsByFilter(
      ORDER_COLLECTION,
      filter,
      [["reception_date", "desc"]],
      { limit, offset }
    );

    result.docs = result.docs.map((item) => {
      let newData = {
        ...item,
      };
      newData.reception_date =
        new Date(newData?.reception_date?.seconds * 1000) || undefined;
      newData.end_date =
        new Date(newData?.end_date?.seconds * 1000) || undefined;
      return req.firebase.cleanValuesDocument(newData, [
        "client",
        "items",
        "reception",
      ]);
    });

    return res.status(200).json({
      status_code: 200,
      ...result,
    });
  } catch (error) {
    console.log("order get-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getOrder = async (request: Request, res: Response) => {
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
    const { id = "" } = req.body;

    // buscamos la orden
    const orderFound = await req.firebase.getDocumentById(ORDER_COLLECTION, id);

    if (!orderFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_NOT_FOUND",
        errors: ["Orden no existente"],
      });
    }

    orderFound.reception_date = new Date(
      orderFound?.reception_date?.seconds * 1000
    );

    orderFound.end_date = new Date(orderFound?.end_date?.seconds * 1000);

    orderFound.client = await req.firebase.getObjectByReference(
      orderFound.client
    );

    orderFound.client = req.firebase.showValuesDocument(orderFound.client, [
      "id",
      "email",
      "first_name",
      "last_name",
      "second_last_name",
    ]);

    orderFound.reception = await req.firebase.getObjectByReference(
      orderFound.reception
    );

    orderFound.reception = req.firebase.showValuesDocument(
      orderFound.reception,
      ["id", "number_table", "code"]
    );

    const itemsFound = orderFound.items.map((item: any) =>
      req.firebase.getObjectByReference(item)
    );

    orderFound.items = await Promise.all(itemsFound);

    orderFound.items = orderFound.items.map((item: any) =>
      req.firebase.cleanValuesDocument(item, ["order"])
    );

    const productsData = orderFound.items.map((prod: any) =>
      req.firebase.getObjectByReference(prod.product)
    );

    const productsResult = await Promise.all(productsData);

    orderFound.items = orderFound.items.map((item: any) => {
      const newData = { ...item };
      newData.product = productsResult.find(
        (pro) => pro.id === item.product.id
      );
      newData.product = req.firebase.showValuesDocument(newData.product, [
        "id",
        "name",
        "status",
        "price",
        "available",
      ]);
      return newData;
    });

    return res.status(200).json({
      status_code: 200,
      data: {
        order: orderFound,
      },
      errors: [],
    });
  } catch (error) {
    console.log("order get-order response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const inProcessOrder = async (request: Request, res: Response) => {
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
    const { id = undefined, estimated_time = 0 } = req.body;

    const orderFound = await req.firebase.getDocumentById(ORDER_COLLECTION, id);

    if (!orderFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_NOT_FOUND",
        errors: ["Orden no existente"],
      });
    }

    if (orderFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_IS_ANULLED",
        errors: ["La orden se encuentra anulada"],
      });
    }

    if (orderFound.status === 2) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_IS_IN_PROCESS",
        errors: ["La orden se encuentra en proceso"],
      });
    }

    if (orderFound.status === 3) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_IS_TERMINATED",
        errors: ["La orden se encuentra terminada"],
      });
    }

    const { id: orderId, ...rest } = orderFound;

    await req.firebase.updateDocumentById(ORDER_COLLECTION, id, {
      ...rest,
      status: 2,
      estimated_time,
      updated_date: generateUTCToLimaDate(),
    });

    const newOrder = await req.firebase.getDocumentById(ORDER_COLLECTION, id);

    newOrder.reception_date = new Date(
      newOrder?.reception_date?.seconds * 1000
    );

    newOrder.end_date = new Date(newOrder?.end_date?.seconds * 1000);

    newOrder.client = await req.firebase.getObjectByReference(newOrder.client);

    newOrder.client = req.firebase.showValuesDocument(newOrder.client, [
      "id",
      "email",
      "first_name",
      "last_name",
      "second_last_name",
    ]);

    newOrder.reception = await req.firebase.getObjectByReference(
      newOrder.reception
    );

    newOrder.reception = req.firebase.showValuesDocument(newOrder.reception, [
      "id",
      "number_table",
      "code",
    ]);

    const itemsFound = newOrder.items.map((item: any) =>
      req.firebase.getObjectByReference(item)
    );

    newOrder.items = await Promise.all(itemsFound);

    newOrder.items = newOrder.items.map((item: any) =>
      req.firebase.cleanValuesDocument(item, ["order"])
    );

    const productsData = newOrder.items.map((prod: any) =>
      req.firebase.getObjectByReference(prod.product)
    );

    const productsResult = await Promise.all(productsData);

    newOrder.items = newOrder.items.map((item: any) => {
      const newData = { ...item };
      newData.product = productsResult.find(
        (pro) => pro.id === item.product.id
      );
      newData.product = req.firebase.showValuesDocument(newData.product, [
        "id",
        "name",
        "status",
        "price",
        "available",
      ]);
      return newData;
    });

    return res.status(200).json({
      status_code: 200,
      data: {
        order: newOrder,
      },
      message: "La orden fue actualizada a en proceso éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("order in-process-order response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const terminateOrder = async (request: Request, res: Response) => {
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
    const { id = undefined } = req.body;

    const orderFound = await req.firebase.getDocumentById(ORDER_COLLECTION, id);

    if (!orderFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_NOT_FOUND",
        errors: ["Orden no existente"],
      });
    }

    if (orderFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_IS_ANULLED",
        errors: ["La orden se encuentra anulada"],
      });
    }

    if (orderFound.status === 1) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_IS_PENDING",
        errors: ["La orden se encuentra pendiente de tomar"],
      });
    }

    if (orderFound.status === 3) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_IS_TERMINATED",
        errors: ["La orden se encuentra terminada"],
      });
    }

    const { id: orderId, ...rest } = orderFound;

    await req.firebase.updateDocumentById(ORDER_COLLECTION, id, {
      ...rest,
      status: 3,
      end_date: generateUTCToLimaDate(),
      updated_date: generateUTCToLimaDate(),
    });

    const newOrder = await req.firebase.getDocumentById(ORDER_COLLECTION, id);

    newOrder.reception_date = new Date(
      newOrder?.reception_date?.seconds * 1000
    );

    newOrder.end_date = new Date(newOrder?.end_date?.seconds * 1000);

    newOrder.client = await req.firebase.getObjectByReference(newOrder.client);

    newOrder.client = req.firebase.showValuesDocument(newOrder.client, [
      "id",
      "email",
      "first_name",
      "last_name",
      "second_last_name",
    ]);

    newOrder.reception = await req.firebase.getObjectByReference(
      newOrder.reception
    );

    newOrder.reception = req.firebase.showValuesDocument(newOrder.reception, [
      "id",
      "number_table",
      "code",
    ]);

    const itemsFound = newOrder.items.map((item: any) =>
      req.firebase.getObjectByReference(item)
    );

    newOrder.items = await Promise.all(itemsFound);

    newOrder.items = newOrder.items.map((item: any) =>
      req.firebase.cleanValuesDocument(item, ["order"])
    );

    const productsData = newOrder.items.map((prod: any) =>
      req.firebase.getObjectByReference(prod.product)
    );

    const productsResult = await Promise.all(productsData);

    newOrder.items = newOrder.items.map((item: any) => {
      const newData = { ...item };
      newData.product = productsResult.find(
        (pro) => pro.id === item.product.id
      );
      newData.product = req.firebase.showValuesDocument(newData.product, [
        "id",
        "name",
        "status",
        "price",
        "available",
      ]);
      return newData;
    });

    const template = templateEmailOrderUserTerminated({
      email: newOrder.client?.email?.toLowerCase().trim() || "",
      firstName: newOrder.client?.first_name?.trim() || "",
      lastName: newOrder.client?.last_name?.trim() || "",
      orderNumber: newOrder?.order_number?.toString(),
      paymentMethod: newOrder.payment_method,
      total: newOrder?.total?.toFixed(2),
      transactionDate: formatDatetoYYYYMMDDHHmmSS(newOrder.reception_date),
      deliveryDate: formatDatetoYYYYMMDDHHmmSS(newOrder.end_date),
    });

    const resEmail = await sendMail(template, "order terminate-order");

    if (resEmail.status_code !== 200) {
      return res.status(resEmail.status_code).json({
        ...resEmail,
      });
    }

    return res.status(200).json({
      status_code: 200,
      data: {
        order: newOrder,
      },
      message: "La orden fue terminada éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("order terminate-order response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

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

    // verificar que el usuario no tenga una orden en proceso
    const userReference = req.firebase.instanceReferenceById(
      USER_COLLECTION,
      userFound.id || ""
    );

    const userHasOrdersInProcess = await req.firebase.getOneDocument(
      ORDER_COLLECTION,
      [
        ["client", "==", userReference],
        ["status", "in", [1, 2]],
      ]
    );

    if (userHasOrdersInProcess) {
      return res.status(401).json({
        status_code: 401,
        error_code: "USER_HAS_ORDERS_IN_PROCESS",
        errors: ["El usuario tiene pedidos pendientes"],
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
          req.firebase.getDocumentById(ORDER_COLLECTION, item.product)
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
    items.forEach((od: OrderLine) => {
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
          ORDER_COLLECTION,
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

    const template = templateEmailOrderUserReceived({
      email: userFound?.email?.toLowerCase().trim() || "",
      firstName: userFound?.first_name?.trim() || "",
      lastName: userFound?.last_name?.trim() || "",
      orderNumber: newOrderFound?.order_number?.toString(),
      paymentMethod: newOrderFound.payment_method,
      total: newOrderFound?.total?.toFixed(2),
      transactionDate: formatDatetoYYYYMMDDHHmmSS(newOrderFound.reception_date),
    });

    const resEmail = await sendMail(template, "order create-client-order");

    if (resEmail.status_code !== 200) {
      return res.status(resEmail.status_code).json({
        ...resEmail,
      });
    }

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

const getClientList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  let { status = undefined, limit = 20, offset = 0 } = req.body;

  const filter: [
    fieldPath: string | FieldPath,
    opStr: WhereFilterOp,
    value: unknown
  ][] = [];

  if (typeof status === "number") {
    filter.push(["status", "==", status]);
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

    const userReference = req.firebase.instanceReferenceById(
      USER_COLLECTION,
      userFound.id || ""
    );

    filter.push(["client", "==", userReference]);

    const result = await req.firebase.getDocumentsByFilter(
      ORDER_COLLECTION,
      filter,
      [["reception_date", "desc"]],
      { limit, offset }
    );

    result.docs = result.docs.map((item) => {
      let newData = {
        ...item,
      };
      newData.reception_date =
        new Date(newData?.reception_date?.seconds * 1000) || undefined;
      newData.end_date =
        new Date(newData?.end_date?.seconds * 1000) || undefined;
      return req.firebase.cleanValuesDocument(newData, [
        "client",
        "items",
        "reception",
      ]);
    });

    return res.status(200).json({
      status_code: 200,
      ...result,
    });
  } catch (error) {
    console.log("order get-client-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getClientOrder = async (request: Request, res: Response) => {
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

    const { id = "" } = req.body;

    // buscamos la orden
    const orderFound = await req.firebase.getDocumentById(ORDER_COLLECTION, id);

    if (!orderFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_NOT_FOUND",
        errors: ["Orden no existente"],
      });
    }

    if (orderFound?.client?.id !== userFound.id) {
      return res.status(401).json({
        status_code: 401,
        error_code: "ORDER_NOT_FOUND",
        errors: ["Orden no existente"],
      });
    }

    orderFound.reception_date = new Date(
      orderFound?.reception_date?.seconds * 1000
    );

    orderFound.end_date = new Date(orderFound?.end_date?.seconds * 1000);

    orderFound.client = await req.firebase.getObjectByReference(
      orderFound.client
    );

    orderFound.client = req.firebase.showValuesDocument(orderFound.client, [
      "id",
      "first_name",
      "last_name",
      "second_last_name",
    ]);

    orderFound.reception = await req.firebase.getObjectByReference(
      orderFound.reception
    );

    orderFound.reception = req.firebase.showValuesDocument(
      orderFound.reception,
      ["id", "number_table", "code"]
    );

    const itemsFound = orderFound.items.map((item: any) =>
      req.firebase.getObjectByReference(item)
    );

    orderFound.items = await Promise.all(itemsFound);

    orderFound.items = orderFound.items.map((item: any) =>
      req.firebase.cleanValuesDocument(item, ["order"])
    );

    const productsData = orderFound.items.map((prod: any) =>
      req.firebase.getObjectByReference(prod.product)
    );

    const productsResult = await Promise.all(productsData);

    orderFound.items = orderFound.items.map((item: any) => {
      const newData = { ...item };
      newData.product = productsResult.find(
        (pro) => pro.id === item.product.id
      );
      newData.product = req.firebase.showValuesDocument(newData.product, [
        "id",
        "name",
      ]);
      return newData;
    });

    return res.status(200).json({
      status_code: 200,
      data: {
        order: orderFound,
      },
      errors: [],
    });
  } catch (error) {
    console.log("order get-client-order response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export {
  getList,
  getOrder,
  inProcessOrder,
  terminateOrder,
  createClientOrder,
  getClientList,
  getClientOrder,
};
