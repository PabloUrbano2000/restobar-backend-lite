// Servidor de Express
import express, { Express } from "express";
import cors from "cors";

import fileUpload from "express-fileupload";

import firebase, { Firebase } from "../firebase";

import systemAuthRouter from "../routes/systemAuth.routes";

class Server {
  app: Express;
  port: number | string;
  firebase: Firebase;
  constructor() {
    this.app = express();
    this.port = Number(process.env["PORT"]) || 4000;
    this.firebase = firebase;
  }

  middlewares() {
    // CORS
    this.app.use(cors());

    // Desplegar el directorio público
    this.app.use(express.static("public"));

    // Parseo del body
    this.app.use(express.json({ limit: "50mb" }));

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
      })
    );

    this.app.use((req: Request | any, _, next) => {
      req.firebase = this.firebase;
      next();
    });

    this.app.use("/api/admin", systemAuthRouter);
  }

  execute() {
    // Inicializar Middlewares
    this.middlewares();

    // Inicializar Server
    this.app.listen(this.port, () => {
      console.log("server corriendo:", this.port);
    });
  }
}

export default Server;
