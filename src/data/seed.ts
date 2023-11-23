import { DocumentData, DocumentReference } from "firebase/firestore";
import { Firebase } from "../firebase";
import { CATEGORY_COLLECTION } from "../models/Category";
import { categoriesData } from "./initialData";
import { MODULE_COLLECTION } from "../models/Module";
import { ROLE_COLLECTION } from "../models/Role";
import { SYSTEM_USER_COLLECTION } from "../models/SystemUser";

const firebase = new Firebase();

const insertCategories = async () => {
  let newArray: Promise<DocumentReference<DocumentData, DocumentData>>[] = [];
  const currentCategories = await firebase.getDocumentsByFilter(
    CATEGORY_COLLECTION,
    [],
    10
  );
  if (currentCategories.length > 0) {
    console.log(
      "YA EXISTEN CATEGORIAS:",
      currentCategories.map((res) => res.id)
    );
    return;
  }
  if (categoriesData.length > 0) {
    categoriesData.forEach((cat) => {
      newArray.push(firebase.insertDocument(CATEGORY_COLLECTION, cat));
    });
    const result = await Promise.all(newArray);
    console.log(
      "CATEGORIAS ID DUMMY:",
      result.map((res) => res.id)
    );
  }
  firebase.insertDocument(CATEGORY_COLLECTION);
};

export const executeData = async () => {
  await insertCategories();
};

const deleteCollection = async (collection: string) => {
  await firebase.deleteAllDocuments(collection);
  console.log(
    `TODOS LOS DOCUMENTOS DE LA COLECCION ${collection} FUERON ELIMINADOS`
  );
};

export const deleteData = async () => {
  const collections = [
    CATEGORY_COLLECTION,
    MODULE_COLLECTION,
    ROLE_COLLECTION,
    SYSTEM_USER_COLLECTION,
  ];

  const newArray: any[] = [];

  collections.forEach((collection) =>
    newArray.push(deleteCollection(collection))
  );

  await Promise.all(newArray);
};
