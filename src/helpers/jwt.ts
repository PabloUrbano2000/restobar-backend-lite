import jwt from "jsonwebtoken";

const generarJWT = (uid: string) => {
  return new Promise((resolve, reject) => {
    const payload = { uid };
    jwt.sign(
      payload,
      process.env["SOCKET_JWT"] || "",
      {
        expiresIn: "24h",
      },
      (err, token) => {
        if (err) {
          console.log(err);
          reject("No se pudo generar el JWT");
        } else {
          resolve(token);
        }
      }
    );
  });
};

const checkJWT = (token = "") => {
  try {
    const { uid } = jwt.verify(token, process.env["SOCKET_JWT"] || "") as any;
    return [true, uid];
  } catch (error) {
    return [false, null];
  }
};

export { generarJWT, checkJWT };
