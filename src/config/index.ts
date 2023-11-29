import dotenv from "dotenv";
dotenv.config();

const configVariables = {
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || "",
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  JWT_SYS_SECRET: process.env.JWT_SYSTEM_USER_SECRET || "",
  JWT_SYS_REFRESH_SECRET: process.env.JWT_SYSTEM_USER_REFRESH_SECRET || "",
  JWT_SYS_VALIDATION_SECRET:
    process.env.JWT_SYSTEM_USER_VALIDATION_SECRET || "",
  JWT_USER_SECRET: process.env.JWT_USER_SECRET || "",
  JWT_USER_REFRESH_SECRET: process.env.JWT_USER_REFRESH_SECRET || "",
  JWT_USER_VALIDATION_SECRET: process.env.JWT_USER_VALIDATION_SECRET || "",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 0,
  SMTP_SECURE: Boolean(process.env.SMTP_SECURE) ? true : false,
  SMTP_EMAIL: process.env.SMTP_EMAIL || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  HOST_CLIENT: process.env.HOST_CLIENT || "",
  HOST_ADMIN: process.env.HOST_ADMIN || "",
  DOUBLE_OPT_IN_USER: Boolean(process.env.DOUBLE_OPT_IN_USER) ? 1 : 0,
  DOUBLE_OPT_IN_SYS: Boolean(process.env.DOUBLE_OPT_IN_SYSTEM_USER) ? 1 : 0,
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
};

export default configVariables;
