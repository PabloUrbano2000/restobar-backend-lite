// Servidor de Express
import express, { Express, Request, Response } from "express";
import cors from "cors";

import fileUpload from "express-fileupload";

import firebase, { Firebase } from "../firebase";

import systemAuthRouter from "../routes/systemAuth.routes";
import documentTypeRouter from "../routes/documentType.routes";
import genderRouter from "../routes/gender.routes";
import categoryRouter from "../routes/category.routes";
import receptionRouter from "../routes/reception.routes";
import clientRouter from "../routes/client.routes";
import authRouter from "../routes/auth.routes";
import systemUserRouter from "../routes/systemUser.routes";
import roleRouter from "../routes/role.routes";

import publicRouter from "../routes/public.routes";

import { RequestServer } from "../interfaces/Request";

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
    // this.app.use(express.static("public"));

    // Parseo del body
    this.app.use(express.json({ limit: "50mb" }));

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
      })
    );

    this.app.use((request: Request, _: Response, next) => {
      const req = request as RequestServer;
      req.firebase = this.firebase;
      next();
    });

    // enrutamientos del administrador
    this.app.use("/api/admin/auth", systemAuthRouter);
    this.app.use("/api/admin/document-type", documentTypeRouter);
    this.app.use("/api/admin/gender", genderRouter);
    this.app.use("/api/admin/category", categoryRouter);
    this.app.use("/api/admin/reception", receptionRouter);
    this.app.use("/api/admin/system-user", systemUserRouter);
    this.app.use("/api/admin/role", roleRouter);

    // enrutamientos de cliente
    this.app.use("/api/client/auth", authRouter);

    // listados con token de cliente
    this.app.use("/api/client", clientRouter);

    // rutas públicas
    // this.app.use("/api/public", publicRouter);
  }

  execute() {
    // Inicializar Middlewares
    this.middlewares();

    this.app.get("/", (req, res) => {
      return res.json({
        message: "Bienvenido a la api de restobar :)",
      });
    });

    // Inicializar Server
    this.app.listen(this.port, () => {
      console.log("server corriendo:", this.port);
    });
  }
}

export default Server;
