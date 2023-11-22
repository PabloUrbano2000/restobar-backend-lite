import app from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// importaciones necesarias para firestore
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  Firestore,
} from "firebase/firestore";

// importaciones para storage
import {  uploadBytes, ref } from "firebase/storage";

import firebaseConfig from "./config";

class BodyRequest<T> {
  data: T | null = null;
}

class Firebase {
  private db: Firestore;
  private storage: app.storage.Storage;

  insertDocument: Function;
  getDocuments: Function;
  getDocument: Function;
  updateDocument: Function;
  uploadFile: Function;

  constructor() {
    if (!app.apps.length) {
      app.initializeApp(firebaseConfig);
    }

    // inicialización de firestore
    this.db = getFirestore();

    // inicialización de storage
    this.storage = app.storage();

    // añadir un nuevo documento
    this.insertDocument = async function insertDocument(
      coleccion = "",
      cuerpo = {}
    ) {
      const resultado = await addDoc(collection(this.db, coleccion), {
        ...cuerpo,
      });
      return resultado;
    };

    // obtener documentos sin tiempo real
    this.getDocuments = async function getDocuments(coleccion: string) {
      const documentos = collection(this.db, coleccion);

      const querySnapshot = await getDocs(documentos);
      let array = querySnapshot.docs.map((doc) => {
        return { ...doc.data(), id: doc.id };
      });
      return array;
    };

    this.getDocument = async function getDocument(
      collectionRef: string,
      id: string
    ) {
      const docRef = doc(this.db, collectionRef, id);
      const document = await getDoc(docRef);
      return document;
    };

    // actualizar documento
    this.updateDocument = async function updateDocument(
      coleccion: string,
      id: string,
      cuerpo: BodyRequest<any>
    ) {
      const resultado = await setDoc(doc(this.db, coleccion, id), {
        ...cuerpo,
      });
      return resultado;
    };

    // subida de imagen
    this.uploadFile = async function uploadFile(archivo: any) {
      return await this.storage.ref(`${archivo}`).put(archivo);
    };

    // subir imagen nativamente
    this.uploadFile = async function uploadFile(filename: string, file: any) {
      const storageRef = ref(this.storage, filename);
      const result = await uploadBytes(storageRef, file);
      return result;
    };
  }
}

const firebase = new Firebase();
export { Firebase };
export default firebase;
