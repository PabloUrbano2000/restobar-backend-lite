import { DocumentData, DocumentReference } from "firebase/firestore";
import { Firebase } from "../firebase";

import {
  categoriesData,
  documentTypesData,
  gendersData,
  modulesData,
  productsBeveragesData,
  productsMenuData,
  receptionData,
  rolesData,
  settingsData,
  systemUsersData,
  usersData,
} from "./data";

import {
  // master
  SETTING_COLLECTION,
  MODULE_COLLECTION,
  GENDER_COLLECTION,
  CATEGORY_COLLECTION,
  DOCUMENT_TYPE_COLLECTION,
  RECEPTION_COLLECTION,

  // dependences
  ROLE_COLLECTION,
  SYSTEM_USER_COLLECTION,
  PRODUCT_COLLECTION,
  USER_COLLECTION,
  ORDER_COLLECTION,
  ORDER_DETAILS_COLLECTION,
} from "../models/Collections";

import { CATEGORIES, MODULES, ROLES } from "./constants";
import { Module, Product, Role, SystemUser, User } from "../models/Entities";
import { encryptPassword } from "../helpers/passwords";

const firebase = new Firebase();

const insertMasterCollection = async (collection: string, dataList: any) => {
  let newArray: Promise<DocumentReference<DocumentData, DocumentData>>[] = [];
  const { docs: currentData } = await firebase.getDocumentsByFilter(
    collection,
    [],
    [],
    { limit: 10 }
  );
  // if (currentData.length > 0) {
  //   console.log(
  //     `YA EXISTEN DOCUMENTOS EN LA COLECCIÓN ${collection}:`,
  //     currentData.map((res) => res.id)
  //   );
  //   return;
  // }
  if (dataList.length > 0) {
    dataList.forEach((data: any) => {
      newArray.push(firebase.insertDocument(collection, data));
    });
    const result = await Promise.all(newArray);
    console.log(
      `ID'S DE LOS DOCUMENTOS INSERTADOS EN LA COLECCIÓN ${collection}:`,
      result.map((res) => res.id)
    );
  }
};

const insertPermissionsInRoleCollection = async (
  roleName: string,
  permissions: string[] = []
) => {
  const currentData = await firebase.getOneDocument(ROLE_COLLECTION, [
    ["name", "==", roleName],
  ]);
  if (!currentData) {
    console.log(
      `NO EXISTE EL DOCUMENTO ${roleName} EN LA COLECCIÓN ${ROLE_COLLECTION}`
    );
    return;
  }

  const parseData = currentData as Role;

  if (parseData && parseData.permissions && parseData.permissions.length > 0) {
    console.log(
      `YA EXISTEN permissions ASIGNADOS AL DOCUMENTO ${roleName} DE LA COLECCIÓN ${ROLE_COLLECTION}:`,
      parseData.permissions
    );
    return;
  }

  // buscamos todos los modulos
  const { docs: foundModules } = await firebase.getDocumentsByFilter(
    MODULE_COLLECTION,
    [["status", "==", 1]]
  );

  let permissionsArray: DocumentReference<DocumentData, DocumentData>[] = [];
  if (foundModules.length > 0) {
    foundModules.forEach((mod: Module) => {
      if (permissions.includes(mod.name || "")) {
        permissionsArray.push(
          firebase.instanceReferenceById(MODULE_COLLECTION, mod?.id || "")
        );
      }
    });
  }

  if (permissionsArray.length > 0) {
    const { id, ...data } = currentData;
    const newData = {
      ...data,
      permissions: permissionsArray,
    };

    await firebase.updateDocumentById(ROLE_COLLECTION, id || "", newData);

    console.log(
      `DOCUMENTO ${roleName} ACTUALIZADO DE LA COLECCIÓN ${PRODUCT_COLLECTION} CON LOS SIGUIENTES PERMISOS:`,
      permissions.map((per) => per)
    );
  }
};

const insertProductsCollection = async (datalist: any, category: string) => {
  const foundCategory = await firebase.getOneDocument(CATEGORY_COLLECTION, [
    ["name", "==", category],
  ]);
  if (!foundCategory) {
    return;
  }
  let newArray: Promise<DocumentReference<DocumentData, DocumentData>>[] = [];
  const { docs: currentData } = await firebase.getDocumentsByFilter(
    PRODUCT_COLLECTION,
    [
      [
        "category",
        "==",
        firebase.instanceReferenceById(CATEGORY_COLLECTION, foundCategory.id),
      ],
    ],
    [],
    { limit: 10 }
  );
  if (currentData.length > 0) {
    console.log(
      `YA EXISTEN DOCUMENTOS EN LA COLECCIÓN ${PRODUCT_COLLECTION}:`,
      currentData.map((res) => res.id)
    );
    return;
  }
  if (datalist.length > 0) {
    if (foundCategory) {
      datalist.forEach((data: Product) => {
        const newData = {
          ...data,
          category: firebase.instanceReferenceById(
            CATEGORY_COLLECTION,
            foundCategory.id
          ),
        };
        newArray.push(firebase.insertDocument(PRODUCT_COLLECTION, newData));
      });
      const result = await Promise.all(newArray);
      console.log(
        `ID'S DE LOS DOCUMENTOS DE CATEGORIA ${category} INSERTADOS EN LA COLECCIÓN ${PRODUCT_COLLECTION}:`,
        result.map((res) => res.id)
      );
    }
  }
};

const insertUsersCollection = async () => {
  let newArray: Promise<DocumentReference<DocumentData, DocumentData>>[] = [];
  const { docs: currentData } = await firebase.getDocumentsByFilter(
    USER_COLLECTION,
    [],
    [],
    { limit: 10 }
  );
  if (currentData.length > 0) {
    console.log(
      `YA EXISTEN DOCUMENTOS EN LA COLECCIÓN ${USER_COLLECTION}:`,
      currentData.map((res) => res.id)
    );
    return;
  }
  if (usersData.length > 0) {
    const encryptPasswords = await Promise.all(
      usersData.map((data) => encryptPassword(data.password || ""))
    );
    usersData.forEach((data: User, index: number) => {
      const password = encryptPasswords[index];
      const newData = { ...data, password };
      newArray.push(firebase.insertDocument(USER_COLLECTION, newData));
    });
    const result = await Promise.all(newArray);
    console.log(
      `ID'S DE LOS DOCUMENTOS INSERTADOS EN LA COLECCIÓN ${USER_COLLECTION}:`,
      result.map((res) => res.id)
    );
  }
};

const insertSystemUsersCollection = async () => {
  let newArray: Promise<DocumentReference<DocumentData, DocumentData>>[] = [];
  const { docs: currentData } = await firebase.getDocumentsByFilter(
    SYSTEM_USER_COLLECTION,
    [],
    [],
    {
      limit: 10,
    }
  );
  if (currentData.length > 0) {
    console.log(
      `YA EXISTEN DOCUMENTOS EN LA COLECCIÓN ${SYSTEM_USER_COLLECTION}:`,
      currentData.map((res) => res.id)
    );
    return;
  }
  if (systemUsersData.length > 0) {
    const foundRole = await firebase.getOneDocument(ROLE_COLLECTION, [
      ["name", "==", ROLES.GLOBAL_ADMIN],
    ]);
    if (foundRole) {
      const encryptPasswords = await Promise.all(
        systemUsersData.map((data) => encryptPassword(data.password || ""))
      );
      systemUsersData.forEach((data: SystemUser, index: number) => {
        const password = encryptPasswords[index];
        const newData = {
          ...data,
          password,
          role: firebase.instanceReferenceById(ROLE_COLLECTION, foundRole.id),
        };
        newArray.push(firebase.insertDocument(SYSTEM_USER_COLLECTION, newData));
      });
      const result = await Promise.all(newArray);
      console.log(
        `ID'S DE LOS DOCUMENTOS INSERTADOS EN LA COLECCIÓN ${SYSTEM_USER_COLLECTION}:`,
        result.map((res) => res.id)
      );
    }
  }
};

export const executeData = async () => {
  console.log("======= INSERTANDO COLECCIONES MAESTRAS =======\n");
  await insertMasterCollection(SETTING_COLLECTION, settingsData);
  await insertMasterCollection(MODULE_COLLECTION, modulesData);
  await insertMasterCollection(CATEGORY_COLLECTION, categoriesData);
  await insertMasterCollection(GENDER_COLLECTION, gendersData);
  await insertMasterCollection(DOCUMENT_TYPE_COLLECTION, documentTypesData);
  await insertMasterCollection(RECEPTION_COLLECTION, receptionData);
  await insertMasterCollection(ROLE_COLLECTION, rolesData);

  console.log("\n======= INSERTANDO COLECCIONES CON DEPENDENCIA =======\n");
  await insertPermissionsInRoleCollection(ROLES.GLOBAL_ADMIN, [
    MODULES.ORDERS,
    MODULES.PRODUCTS,
    MODULES.RECEPTIONS,
    MODULES.SYSTEM_USERS,
    MODULES.USERS,
    MODULES.ROLES,
  ]);
  await insertPermissionsInRoleCollection(ROLES.ADMIN, [
    MODULES.ORDERS,
    MODULES.PRODUCTS,
    MODULES.RECEPTIONS,
    MODULES.USERS,
  ]);
  await insertPermissionsInRoleCollection(ROLES.CHEF, [
    MODULES.ORDERS,
    MODULES.PRODUCTS,
    MODULES.USERS,
  ]);
  await insertPermissionsInRoleCollection(ROLES.WAITER, [
    MODULES.ORDERS,
    MODULES.PRODUCTS,
    MODULES.USERS,
  ]);

  await insertProductsCollection(productsMenuData, CATEGORIES.MENU);
  await insertProductsCollection(productsBeveragesData, CATEGORIES.BEBIDAS);

  await insertUsersCollection();
  await insertSystemUsersCollection();

  process.exit(0);
};

const deleteCollection = async (collection: string) => {
  await firebase.deleteAllDocuments(collection);
  console.log(
    `TODOS LOS DOCUMENTOS DE LA COLECCION ${collection} FUERON ELIMINADOS`
  );
};

export const deleteData = async () => {
  const collections: string[] = [
    SETTING_COLLECTION,
    MODULE_COLLECTION,
    ROLE_COLLECTION,
    SYSTEM_USER_COLLECTION,
    CATEGORY_COLLECTION,
    PRODUCT_COLLECTION,
    GENDER_COLLECTION,
    DOCUMENT_TYPE_COLLECTION,
    USER_COLLECTION,
    RECEPTION_COLLECTION,
    ORDER_COLLECTION,
    ORDER_DETAILS_COLLECTION,
  ];

  const newArray: Promise<void>[] = [];

  collections.forEach((collection) =>
    newArray.push(deleteCollection(collection))
  );

  await Promise.all(newArray);

  process.exit(0);
};
