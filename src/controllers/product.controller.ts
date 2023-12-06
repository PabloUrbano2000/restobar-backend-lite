import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import { RequestServer } from "../interfaces/Request";
import { CATEGORY_COLLECTION, PRODUCT_COLLECTION } from "../models/Collections";
import { ErrorFormat } from "../interfaces/Error";
import { validationResult } from "express-validator";
import { generateUTCToLimaDate } from "../helpers/generators";
import { FieldPath, WhereFilterOp } from "firebase/firestore";
import { Product } from "../models/Product";
import config from "../config";

cloudinary.config({
  cloud_name: config.CLOUDINARY_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});

const getList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  let { category = "", limit = 100, offset = 0, status } = req.body;

  const filter: [
    fieldPath: string | FieldPath,
    opStr: WhereFilterOp,
    value: unknown
  ][] = [];

  if (typeof status === "number") {
    filter.push(["status", "==", status]);
  }

  if (category) {
    filter.push([
      "category",
      "==",
      req.firebase.instanceReferenceById(CATEGORY_COLLECTION, category),
    ]);
  }

  try {
    const result = await req.firebase.getDocumentsByFilter(
      PRODUCT_COLLECTION,
      filter,
      [["name", "asc"]],
      { limit, offset }
    );

    if (result.docs.length > 0) {
      const categoriesId: string[] = [];
      const categoriesData: Promise<any>[] = [];

      for (let data of result.docs) {
        if (data?.category?.id && !categoriesId.includes(data?.category?.id)) {
          categoriesId.push(data?.category?.id);
          categoriesData.push(req.firebase.getObjectByReference(data.category));
        }
      }

      const categoriesResult = await Promise.all(categoriesData);

      const filterData = result.docs.map((data) => {
        if (data?.category?.id) {
          const categoryId = data.category.id || undefined;
          data.category = categoriesResult.find((cat) => cat.id == categoryId);

          data.category = req.firebase.cleanValuesDocument(data.category, [
            "status",
          ]);
        }

        data.created_date = new Date(data.created_date?.seconds * 1000);
        data.updated_date = new Date(data.updated_date?.seconds * 1000);
        return data;
      });

      result.docs = filterData;
    }

    return res.status(200).json({
      status_code: 200,
      ...result,
    });
  } catch (error) {
    console.log("product get-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getProduct = async (request: Request, res: Response) => {
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

    const productFound = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (!productFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_NOT_FOUND",
        errors: ["Producto no existente"],
      });
    }

    if (productFound.category) {
      productFound.category = await req.firebase.getObjectByReference(
        productFound.category
      );
    }

    productFound.created_date = new Date(
      productFound.created_date?.seconds * 1000
    );
    productFound.updated_date = new Date(
      productFound.updated_date?.seconds * 1000
    );

    return res.status(200).json({
      status_code: 200,
      data: {
        product: productFound,
      },
      errors: [],
    });
  } catch (error) {
    console.log("product get-product response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const createProduct = async (request: Request, res: Response) => {
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
    const {
      name = "",
      price = 0,
      description = "",
      status = undefined,
      available = undefined,
      category = "",
    } = req.body;

    const isExistProductByName = await req.firebase.getOneDocument(
      PRODUCT_COLLECTION,
      [["name", "==", name?.toLowerCase()]]
    );

    if (isExistProductByName) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_EXIST",
        errors: ["El producto ya se encuentra registrado por el nombre"],
      });
    }

    let attributes: any = {};

    if (typeof status !== "undefined") {
      attributes.status = status;
    }

    if (typeof available !== "undefined") {
      attributes.available = available;
    }

    const categoryFound = await req.firebase.getDocumentById(
      CATEGORY_COLLECTION,
      category
    );

    if (!categoryFound) {
      console.log(category, categoryFound);
      return res.status(401).json({
        status_code: 401,
        error_code: "CATEGORY_NOT_FOUND",
        errors: ["Categoría no existente"],
      });
    }

    const categoryInstance = req.firebase.instanceReferenceById(
      CATEGORY_COLLECTION,
      categoryFound.id
    );

    const result = await req.firebase.insertDocument(PRODUCT_COLLECTION, {
      name: name.toLowerCase(),
      price,
      description,
      image: "",
      category: categoryInstance,
      status: 1,
      available: 1,
      ...attributes,
      created_date: generateUTCToLimaDate(),
    });

    const productFound = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      result.id
    );

    productFound.created_date = new Date(
      productFound.created_date?.seconds * 1000
    );
    productFound.updated_date = new Date(
      productFound.updated_date?.seconds * 1000
    );

    productFound.category = await req.firebase.getObjectByReference(
      productFound.category
    );

    return res.status(200).json({
      status_code: 200,
      data: {
        product: productFound,
      },
      message: "Producto registrado éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("product create-product response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const updateProduct = async (request: Request, res: Response) => {
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
    const {
      id = "",
      name = undefined,
      price = undefined,
      status = undefined,
      available = undefined,
      category = undefined,
      description = undefined,
    } = req.body;

    if (
      name === undefined &&
      price === undefined &&
      status === undefined &&
      available === undefined &&
      category === undefined &&
      description === undefined
    ) {
      return res.status(400).json({
        status_code: 400,
        error_code: "INVALID_BODY_FIELDS",
        errors: ["No se envió información para actualizar"],
      });
    }

    const productFound = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (!productFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_NOT_FOUND",
        errors: ["Producto no existente"],
      });
    }

    if (name !== undefined) {
      const { docs } = await req.firebase.getDocumentsByFilter(
        PRODUCT_COLLECTION,
        [["name", "==", name?.toLowerCase()]]
      );

      if (docs.length > 0) {
        console.log(docs);
        const hasDuplicate = docs.some((doc: Product) => doc.id !== id);
        console.log(hasDuplicate);
        if (hasDuplicate) {
          return res.status(401).json({
            status_code: 401,
            error_code: "PRODUCT_EXIST",
            errors: ["Ya existe un producto con el mismo nombre"],
          });
        }
      }
    }

    let attributes: any = {};

    if (name) {
      attributes.name = name;
    }

    if (description) {
      attributes.description = description;
    }

    if (typeof price === "number") {
      attributes.price = price;
    }

    if (typeof status === "number") {
      attributes.status = status;
    }

    if (typeof available === "number") {
      attributes.available = available;
    }

    if (category) {
      const categoryFound = await req.firebase.getDocumentById(
        CATEGORY_COLLECTION,
        category
      );
      if (!categoryFound) {
        return res.status(401).json({
          status_code: 401,
          error_code: "CATEGORY_NOT_FOUND",
          errors: ["Categoría no existente"],
        });
      }
      const categoryInstance = req.firebase.instanceReferenceById(
        CATEGORY_COLLECTION,
        categoryFound.id
      );
      attributes.category = categoryInstance;
    }

    const { id: productId, ...rest } = productFound;

    await req.firebase.updateDocumentById(PRODUCT_COLLECTION, id, {
      ...rest,
      ...attributes,
      updated_date: generateUTCToLimaDate(),
    });

    const newProduct = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (newProduct.category) {
      newProduct.category = await req.firebase.getObjectByReference(
        newProduct.category
      );
    }

    newProduct.created_date = new Date(newProduct.created_date?.seconds * 1000);
    newProduct.updated_date = new Date(newProduct.updated_date?.seconds * 1000);

    return res.status(200).json({
      status_code: 200,
      data: {
        product: newProduct,
      },
      message: "Producto actualizado éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("product update-product response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const disableProduct = async (request: Request, res: Response) => {
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

    const productFound = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (!productFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_NOT_FOUND",
        errors: ["Producto no existente"],
      });
    }

    if (productFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_IS_DISABLED",
        errors: ["El producto se encuentra inhabilitado"],
      });
    }

    const { id: productId, ...rest } = productFound;

    await req.firebase.updateDocumentById(PRODUCT_COLLECTION, id, {
      ...rest,
      status: 0,
      updated_date: generateUTCToLimaDate(),
    });

    const newProduct = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (newProduct.category) {
      newProduct.category = await req.firebase.getObjectByReference(
        newProduct.category
      );
    }

    newProduct.created_date = new Date(newProduct.created_date?.seconds * 1000);
    newProduct.updated_date = new Date(newProduct.updated_date?.seconds * 1000);

    return res.status(200).json({
      status_code: 200,
      data: {
        product: newProduct,
      },
      message: "Producto inhabilitado éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("product disable-product response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const enableProduct = async (request: Request, res: Response) => {
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

    const productFound = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (!productFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_NOT_FOUND",
        errors: ["Producto no existente"],
      });
    }

    if (productFound.status === 1) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_IS_ENABLED",
        errors: ["El producto se encuentra habilitado"],
      });
    }

    const { id: productId, ...rest } = productFound;

    await req.firebase.updateDocumentById(PRODUCT_COLLECTION, id, {
      ...rest,
      status: 1,
      updated_date: generateUTCToLimaDate(),
    });

    const newProduct = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (newProduct.category) {
      newProduct.category = await req.firebase.getObjectByReference(
        newProduct.category
      );
    }

    newProduct.created_date = new Date(newProduct.created_date?.seconds * 1000);
    newProduct.updated_date = new Date(newProduct.updated_date?.seconds * 1000);

    return res.status(200).json({
      status_code: 200,
      data: {
        product: newProduct,
      },
      message: "Producto habilitado éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("product enable-product response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const unavailableProduct = async (request: Request, res: Response) => {
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

    const productFound = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (!productFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_NOT_FOUND",
        errors: ["Recepción no existente"],
      });
    }

    if (productFound.available === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_IS_UNAVAILABLE",
        errors: ["El producto se encuentra indisponible"],
      });
    }

    const { id: productId, ...rest } = productFound;

    await req.firebase.updateDocumentById(PRODUCT_COLLECTION, id, {
      ...rest,
      available: 0,
      updated_date: generateUTCToLimaDate(),
    });

    const newProduct = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (newProduct.category) {
      newProduct.category = await req.firebase.getObjectByReference(
        newProduct.category
      );
    }

    newProduct.created_date = new Date(newProduct.created_date?.seconds * 1000);
    newProduct.updated_date = new Date(newProduct.updated_date?.seconds * 1000);

    return res.status(200).json({
      status_code: 200,
      data: {
        product: newProduct,
      },
      message: "Producto indisponible éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("product unavailable-product response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const availableProduct = async (request: Request, res: Response) => {
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

    const productFound = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (!productFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_NOT_FOUND",
        errors: ["Producto no existente"],
      });
    }

    if (productFound.available === 1) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_IS_AVAILABLE",
        errors: ["El producto se encuentra disponible"],
      });
    }

    const { id: productId, ...rest } = productFound;

    await req.firebase.updateDocumentById(PRODUCT_COLLECTION, id, {
      ...rest,
      available: 1,
      updated_date: generateUTCToLimaDate(),
    });

    const newProduct = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (newProduct.category) {
      newProduct.category = await req.firebase.getObjectByReference(
        newProduct.category
      );
    }

    newProduct.created_date = new Date(newProduct.created_date?.seconds * 1000);
    newProduct.updated_date = new Date(newProduct.updated_date?.seconds * 1000);

    return res.status(200).json({
      status_code: 200,
      data: {
        product: newProduct,
      },
      message: "Producto disponible éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("product available-product response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getClientList = async (request: Request, res: Response) => {
  const req = request as RequestServer;

  let { category = "", limit = 20, offset = 0 } = req.body;

  const filter: [
    fieldPath: string | FieldPath,
    opStr: WhereFilterOp,
    value: unknown
  ][] = [];

  filter.push(["status", "==", 1]);

  if (category) {
    filter.push([
      "category",
      "==",
      req.firebase.instanceReferenceById(CATEGORY_COLLECTION, category),
    ]);
  }

  try {
    const result = await req.firebase.getDocumentsByFilter(
      PRODUCT_COLLECTION,
      filter,
      [["name", "asc"]],
      { limit, offset }
    );

    if (result.docs.length > 0) {
      const categoriesId: string[] = [];
      const categoriesData: Promise<any>[] = [];

      for (let data of result.docs) {
        if (data?.category?.id && !categoriesId.includes(data?.category?.id)) {
          categoriesId.push(data?.category?.id);
          categoriesData.push(req.firebase.getObjectByReference(data.category));
        }
      }

      const categoriesResult = await Promise.all(categoriesData);

      const filterData = result.docs.map((data) => {
        if (data?.category?.id) {
          const categoryId = data.category.id || undefined;
          data.category = categoriesResult.find((cat) => cat.id == categoryId);

          data.category = req.firebase.cleanValuesDocument(data.category, [
            "status",
          ]);
        }

        data = req.firebase.showValuesDocument(data, [
          "id",
          "name",
          "category",
          "available",
          "description",
        ]);
        return data;
      });

      result.docs = filterData;
    }

    return res.status(200).json({
      status_code: 200,
      ...result,
    });
  } catch (error) {
    console.log("product get-public-list response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const uploadProductImage = async (request: Request, res: Response) => {
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

    const productFound = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (!productFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_NOT_FOUND",
        errors: ["Producto no existente"],
      });
    }

    const { image = {} }: any = req.files || {};

    const { tempFilePath } = image || {};

    if (!tempFilePath) {
      res.status(401).json({
        status_code: 401,
        error_code: "FILE_IS_INVALID",
        errors: ["La imagen no tiene los atributos requeridos"],
      });
    }

    // subiendolo a cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      filename_override: id,
      use_filename: true,
      public_id: id,
      folder: "products",
      overwrite: true,
      unique_filename: false,
    });

    const { url } = result;

    const { id: productId, ...rest } = productFound;

    await req.firebase.updateDocumentById(PRODUCT_COLLECTION, productId, {
      ...rest,
      image: url,
      updated_date: generateUTCToLimaDate(),
    });

    const newProduct = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (newProduct.category) {
      newProduct.category = await req.firebase.getObjectByReference(
        newProduct.category
      );
    }

    newProduct.created_date = new Date(newProduct.created_date?.seconds * 1000);
    newProduct.updated_date = new Date(newProduct.updated_date?.seconds * 1000);

    return res.status(200).json({
      status_code: 200,
      data: {
        product: newProduct,
      },
      message: "Imagen subida éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("product upload-product-image response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const deleteProductImage = async (request: Request, res: Response) => {
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

    const productFound = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (!productFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_NOT_FOUND",
        errors: ["Producto no existente"],
      });
    }

    // subiendolo a cloudinary
    const result = await cloudinary.uploader.destroy(`products/${id}`);

    if (result.result !== "ok") {
      res.status(401).json({
        status_code: 401,
        error_code: "IMAGE_NOT_EXIST_IN_SERVER",
        errors: ["La imagen no se encuentra disponible en el servidor"],
      });
    }

    const { id: productId, ...rest } = productFound;

    await req.firebase.updateDocumentById(PRODUCT_COLLECTION, productId, {
      ...rest,
      image: "",
      updated_date: generateUTCToLimaDate(),
    });

    const newProduct = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (newProduct.category) {
      newProduct.category = await req.firebase.getObjectByReference(
        newProduct.category
      );
    }

    newProduct.created_date = new Date(newProduct.created_date?.seconds * 1000);
    newProduct.updated_date = new Date(newProduct.updated_date?.seconds * 1000);

    return res.status(200).json({
      status_code: 200,
      data: {
        product: newProduct,
      },
      message: "Imagen eliminada éxitosamente",
      errors: [],
    });
  } catch (error) {
    console.log("product delete-product-image response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

const getClientProduct = async (request: Request, res: Response) => {
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

    const productFound = await req.firebase.getDocumentById(
      PRODUCT_COLLECTION,
      id
    );

    if (!productFound) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_NOT_FOUND",
        errors: ["Producto no existente"],
      });
    }

    if (productFound.status === 0) {
      return res.status(401).json({
        status_code: 401,
        error_code: "PRODUCT_IS_DISABLED",
        errors: ["Producto no habilitado"],
      });
    }

    if (productFound.category) {
      productFound.category = await req.firebase.getObjectByReference(
        productFound.category
      );

      productFound.category = req.firebase.cleanValuesDocument(
        productFound.category,
        ["status"]
      );
    }

    const newProduct = req.firebase.cleanValuesDocument(productFound, [
      "created_date",
      "updated_date",
    ]);

    return res.status(200).json({
      status_code: 200,
      data: {
        product: newProduct,
      },
      errors: [],
    });
  } catch (error) {
    console.log("product get-public-product response - error", error);
    return res
      .status(500)
      .json({ status_code: 500, errors: ["Ocurrió un error desconocido"] });
  }
};

export {
  getList,
  getProduct,
  createProduct,
  updateProduct,
  uploadProductImage,
  deleteProductImage,
  disableProduct,
  enableProduct,
  unavailableProduct,
  availableProduct,
  getClientList,
  getClientProduct,
};
