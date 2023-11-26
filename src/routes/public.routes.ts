import { Router } from "express";

const router = Router();

// cloudinary.config({
//   cloud_name: "dok1hjemw",
//   api_key: "394263161853881",
//   api_secret: "bM9O80okaVDQfmKqUxsLYUaTeIk",
//   secure: true,
// });

// router.post("/login", async (req: any, res) => {
//   const resultado = await req.firebase.insertDocument("clientes", req.body);

//   const document = await req.firebase.getDocument("clientes", resultado.id);
//   return res.json({ id: document.id, ...document.data() });
// });

// router.post("/user-photo", async (req: any, res) => {
//   console.log(req.body);
//   console.log(req.files.file);
//   const { file: { tempFilePath = {}, fileName = "" } = {} } = req.files || {};
//   const resultado = await // subiendolo a cloudinary
//   cloudinary.uploader.upload(tempFilePath, {
//     filename_override: fileName,
//     use_filename: true,
//     public_id: fileName,
//     folder: "users",
//     overwrite: true,
//     unique_filename: false,
//   });
//   console.log(resultado);
//   return res.json({ id: "perro", result: resultado });
// });

export default router;
