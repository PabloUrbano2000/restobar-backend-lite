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
  query,
  getDoc,
  doc,
  setDoc,
  Firestore,
  where,
  limit,
  WhereFilterOp,
  DocumentReference,
  QueryConstraint,
  deleteDoc,
} from "firebase/firestore";

import firebaseConfig from "./config";

type Filter = {
  field: string;
  filter: WhereFilterOp;
  value: string | number | boolean | Date;
};

class Firebase {
  private db: Firestore;

  constructor() {
    if (!app.apps.length) {
      app.initializeApp(firebaseConfig);
    }

    // inicialización de firestore
    this.db = getFirestore();
  }

  // añadir un nuevo documento
  async insertDocument(collectionRef: string, body = {}) {
    const result = await addDoc(collection(this.db, collectionRef), {
      ...body,
    });
    return result;
  }

  // obtener documentos sin tiempo real
  async getAllDocuments(collectionRef: string) {
    const docRef = collection(this.db, collectionRef);

    const querySnapshot = await getDocs(docRef);
    const documents = querySnapshot.docs.map((doc) => {
      return { ...doc.data(), id: doc.id };
    });
    return documents || [];
  }

  async getObjectsByReference(references: DocumentReference[] = []) {
    if (references.length > 0) {
      const refArray = references.map((ref) => getDoc(ref));
      const result = await Promise.all(refArray);
      const snapshot = result.map((res) => ({ id: res.id, ...res.data() }));
      return snapshot;
    }
  }
  async getObjectByReference(reference: DocumentReference) {
    if (reference) {
      const ref = await getDoc(reference);
      if (ref) {
        return { id: ref.id, ...ref.data() };
      }
      return null;
    }
  }

  cleanValuesDocument(data: any = {}, values: string[] = []) {
    const newData = { ...data };
    if (values.length > 0) {
      values.forEach((attr) =>
        newData[attr] !== undefined ? delete newData[attr] : null
      );
    }
    return newData;
  }

  async getDocumentById(collectionRef: string, id: string) {
    const docRef = doc(this.db, collectionRef, id);
    const snapshot: any = await getDoc(docRef);
    console.log(snapshot);
    if (!snapshot) {
      return null;
    }

    const document: any = { ...snapshot.data(), id };

    return document;
  }

  // obtener un documento por filtro
  async getOneDocument(collectionRef: string, filter: Filter[]) {
    const docRef = collection(this.db, collectionRef);
    const filters: QueryConstraint[] = [];
    if (filter.length > 0) {
      const query = filter.map((data) =>
        where(data.field, data.filter, data.value)
      );
      filters.push(...query);
    }
    filters.push(limit(1));
    const q = query(docRef, ...filters);
    const querysnapshot = await getDocs(q);

    const documents = querysnapshot.docs.map((doc) => {
      return { ...doc.data(), id: doc.id };
    });

    if (documents.length === 0) {
      return null;
    }
    return documents[0];
  }

  // obtener documentos por filtro
  async getDocumentsByFilter(
    collectionRef: string,
    filter: Filter[],
    limitF: number = 100
  ) {
    const docRef = collection(this.db, collectionRef);
    const filters: QueryConstraint[] = [];
    if (filter.length > 0) {
      const query = filter.map((data) =>
        where(data.field, data.filter, data.value)
      );
      filters.push(...query);
    }
    filters.push(limit(limitF));
    const q = query(docRef, ...filters);
    const querysnapshot = await getDocs(q);

    const documents = querysnapshot.docs.map((doc) => {
      return { ...doc.data(), id: doc.id };
    });

    return documents;
  }

  // actualizar documento
  async updateDocument(collectionRef: string, id: string, body: any = {}) {
    const result = await setDoc(doc(this.db, collectionRef, id), {
      ...body,
    });
    return result;
  }

  async deleteDocumentById(collectionRef: string, id: string) {
    const result = await deleteDoc(doc(this.db, collectionRef, id));
    return result;
  }

  async deleteAllDocuments(collectionRef: string) {
    const docRef = collection(this.db, collectionRef);
    const newArray: Promise<any>[] = [];
    const snapshot = await getDocs(docRef);
    snapshot.docs.forEach((docu) =>
      newArray.push(deleteDoc(doc(this.db, collectionRef, docu.id)))
    );
    if (newArray.length > 0) {
      const result = Promise.all(newArray);
      return result;
    }
    return [];
  }
}

const firebase = new Firebase();

export { Firebase };
export default firebase;
