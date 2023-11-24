import dotenv from "dotenv";
import Server from "./models/Server";
import { executeData, deleteData } from "./seed/functions";

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
