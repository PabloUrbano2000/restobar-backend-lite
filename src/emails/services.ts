import nodemailer, { SendMailOptions } from "nodemailer";
import config from "../config";

export const sendMail = async (infoMail: SendMailOptions, service: string) => {
  try {
    let transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      tls: {
        rejectUnauthorized: false,
      },
      secure: config.SMTP_SECURE, // true for 465, false for other ports
      auth: {
        user: `${config.SMTP_EMAIL}`,
        pass: `${config.SMTP_PASSWORD}`,
      },
    });
    await transporter.sendMail(infoMail);
    return {
      status_code: 200,
      message: "Correo enviado éxitosamente",
      errors: [],
    };
  } catch (error) {
    console.log(`send-email ${service} response - error`, error);
    return {
      status_code: 500,
      error_code: "MAIL_NOT_SEND",
      errors: ["Ocurrió un error al enviar el correo"],
    };
  }
};
