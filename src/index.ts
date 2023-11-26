import dotenv from "dotenv";
import Server from "./models/Server";
import { executeData, deleteData } from "./seed/functions";

// import { Firebase } from "./firebase";
// import { DOCUMENT_TYPE_COLLECTION } from "./models/DocumentType";

dotenv.config();

if (process.argv[2]) {
  if (process.argv[2] === "--insert-seed") {
    console.log("ejecutando flag:", process.argv[2]);
    executeData();
  } else if (process.argv[2] === "--delete-seed") {
    console.log("ejecutando flag:", process.argv[2]);
    deleteData();
  }
} else {
  const server = new Server();
  server.execute();
}

// async function perro() {
//   const firebase = new Firebase();
//   const updated = new Date("2023-11-26")
//   const result = await firebase.getDocumentsByFilter(
//     DOCUMENT_TYPE_COLLECTION,
//     [["updated_date", ">=", updated]],
//     // [["name", "asc"]],
//     [],
//     { limit: 10, offset: 0 }
//   );
//   console.log(result);
// }

// perro();
