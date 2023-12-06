import app from "firebase/compat/app";
import "firebase/compat/firestore";

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
  orderBy,
  OrderByDirection,
  FieldPath,
  startAfter,
} from "firebase/firestore";

import firebaseConfig from "./config";

type PaginateData = {
  limit?: number;
  offset?: number;
};

type PaginateResponse = {
  total_docs: number;
  has_prev_page: boolean;
  has_next_page: boolean;
  limit: number;
  count: number;
  prev_page: number | null;
  next_page: number | null;
  current_page: number;
  total_pages: number;
  docs: any[];
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

  // inserta un nuevo documento en una colección
  async insertDocument(collectionRef: string, body = {}) {
    const result = await addDoc(collection(this.db, collectionRef), {
      ...body,
    });
    return result;
  }

  // obtener documentos sin tiempo real
  async getAllDocuments(
    collectionRef: string,
    order: [string | FieldPath, OrderByDirection | undefined][] = []
  ) {
    const docRef = collection(this.db, collectionRef);

    const filters: QueryConstraint[] = [];

    // ordenar elementos por...
    if (order.length > 0) {
      order.forEach((data) => filters.push(orderBy(...data)));
    }

    const q = query(docRef, ...filters);

    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map((doc) => {
      return { ...doc.data(), id: doc.id };
    });
    return {
      total_docs: documents.length,
      docs: documents,
    };
  }

  // obtener objetos por referencia
  async getObjectsByReference(references: DocumentReference[] = []) {
    if (references.length > 0) {
      const refArray = references.map((ref) => getDoc(ref));
      const result = await Promise.all(refArray);
      const snapshot = result.map((res) => ({ id: res.id, ...res.data() }));
      return snapshot;
    }
  }

  // obtiene un objeto por referencia
  async getObjectByReference(reference: DocumentReference) {
    if (reference) {
      const ref = await getDoc(reference);
      if (ref) {
        return { id: ref.id, ...ref.data() };
      }
      return null;
    }
  }

  // limpia los atributos con valor undefined (no aplica datos dentro de arreglos)
  cleanValuesDocument(data: any = {}, values: string[] = []) {
    const newData = { ...data };
    if (values.length > 0) {
      values.forEach((attr) =>
        newData[attr] !== undefined ? delete newData[attr] : null
      );
    }
    return newData;
  }

  // mostrar solo datos pasados por valores
  showValuesDocument(data: any = {}, values: string[] = []) {
    const newData: any = {};
    if (values.length > 0) {
      values.forEach((attr) =>
        data[attr] !== undefined ? (newData[attr] = data[attr]) : null
      );
    }
    return newData;
  }

  // obtiene un documento por id
  async getDocumentById(collectionRef: string, id: string) {
    const docRef = doc(this.db, collectionRef, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.data()) {
      return null;
    }

    const document: any = { ...snapshot.data(), id };

    return document;
  }

  // obtiene un documento por filtro
  async getOneDocument(
    collectionRef: string,
    filter: [
      fieldPath: string | FieldPath,
      opStr: WhereFilterOp,
      value: unknown
    ][]
  ) {
    const docRef = collection(this.db, collectionRef);
    const filters: QueryConstraint[] = [];
    // filtrar elementos por where
    if (filter.length > 0) {
      const query = filter.map((data) => where(data[0], data[1], data[2]));
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

  // obtiene documentos por filtro y limite
  async getDocumentsByFilter(
    collectionRef: string,
    filter: [
      fieldPath: string | FieldPath,
      opStr: WhereFilterOp,
      value: unknown
    ][] = [],
    order: [string | FieldPath, OrderByDirection | undefined][] = [],
    paginate: PaginateData = { limit: 100, offset: 0 }
  ) {
    const docRef = collection(this.db, collectionRef);
    const filters: QueryConstraint[] = [];

    // filtrar elementos por where
    if (filter.length > 0) {
      const query = filter.map((data) => where(data[0], data[1], data[2]));
      filters.push(...query);
    }

    // ordenar elementos por...
    if (order.length > 0) {
      order.forEach((data) => filters.push(orderBy(...data)));
    }

    const { limit: limitF = 100, offset = 0 } = paginate;

    let documents: { id: string }[] = [];

    // obteniendo el total de documentos
    const totalDocs = await getDocs(query(docRef, ...filters));

    let hasPreviousPage = true;
    let hasNextPage = true;

    if (offset <= 0) {
      hasPreviousPage = false;
    } else if (limitF >= totalDocs.size) {
      hasPreviousPage = false;
    }

    if (totalDocs.size <= 0) {
      hasNextPage = false;
    } else {
      if (offset <= 0 && limitF >= totalDocs.size) {
        hasNextPage = false;
      } else if (limitF * (offset + 1) >= totalDocs.size) {
        hasNextPage = false;
      }
    }

    const response: PaginateResponse = {
      total_docs: totalDocs.size,
      has_prev_page: hasPreviousPage,
      has_next_page: hasNextPage,
      limit: limitF,
      count: 0,
      prev_page: null,
      next_page: null,
      current_page: 0,
      total_pages: 0,
      docs: documents,
    };

    // en caso de tener datos
    if (totalDocs.size > 0) {
      // Primera query para obtener el indice
      const firstSnapshot = await getDocs(
        query(
          docRef,
          ...filters,
          limit(offset === 0 ? limitF : limitF * offset)
        )
      );

      // inicialización
      response.docs = firstSnapshot.docs.map((data) => ({
        id: data.id,
        ...data.data(),
      }));
      response.current_page = 1;
      response.total_pages = Math.ceil(totalDocs.size / limitF);
      response.count = firstSnapshot.size;

      if (response.current_page < response.total_pages) {
        response.next_page = offset + 2;
      }

      if (offset !== 0 && limitF < totalDocs.size) {
        // obtiene el ultimo objeto de la colección obtenida
        const lastVisible = firstSnapshot.docs[firstSnapshot.docs.length - 1];

        // segunda query que ya devuelve los objetos correspondientes
        const nextSnapshot = await getDocs(
          query(
            docRef,
            ...filters,
            startAfter(lastVisible),
            limit(offset === 0 ? limitF : limitF * offset)
          )
        );

        response.docs = nextSnapshot.docs.map((data) => ({
          id: data.id,
          ...data.data(),
        }));
        response.has_next_page = true;
        response.has_prev_page = true;
        response.prev_page = offset;
        response.current_page = offset + 1;
        response.next_page = offset + 2;
        response.count = nextSnapshot.size;

        if (response.current_page >= response.total_pages) {
          response.has_next_page = false;
          response.next_page = null;
        }
      }
    }

    return response;
  }

  // instancia la referencia de un documento por id
  instanceReferenceById(collection: string, id: string) {
    return doc(this.db, collection, id);
  }

  // actualiza un documento por id
  async updateDocumentById(collectionRef: string, id: string, body: any = {}) {
    const result = await setDoc(doc(this.db, collectionRef, id), {
      ...body,
    });
    return result;
  }

  // elimina un documento por id
  async deleteDocumentById(collectionRef: string, id: string) {
    const result = await deleteDoc(doc(this.db, collectionRef, id));
    return result;
  }

  // Elimina todos los documentos de una colección
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
