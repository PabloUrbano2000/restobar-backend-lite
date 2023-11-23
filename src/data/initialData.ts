import config from "../config";
import { Setting } from "../models/Setting";
import { generateUTCToLimaDate } from "../helpers/generators";
import { Status } from "../models/Generic";
import { Module } from "../models/Module";
import { Role } from "../models/Role";
import { Gender } from "../models/Gender";
import { Category } from "../models/Category";
import { DocumentTypeDB } from "../models/DocumentType";
import { Charge } from "../models/Charge";
import { Reception } from "../models/Reception";
import { SystemUser } from "../models/SystemUser";
import { User } from "../models/User";
import { Product } from "../models/Product";

export const settingsData: Setting[] = [
  {
    opening_time: "06:00:00",
    closing_time: "20:00:00",
    system_manual: "",
    tax: 0.18,
    ruc: "",
    business_name: "Restobar admin S.A.C.",
    address: "Jirón Las Magnolias 500, Lima",
    user_double_opt_in: config.DOUBLE_OPT_IN_USER as Status,
    system_user_double_opt_in: config.DOUBLE_OPT_IN_SYS as Status,
    created_date: generateUTCToLimaDate(),
    status: 1,
    user_creator: null,
    last_publication_date: generateUTCToLimaDate(),
    last_user_publisher: null,
  },
];

export const modulesData: Module[] = [
  { name: "EMPLOYEES", status: 1 },
  {
    name: "SYSTEM_USERS",
    status: 1,
  },
  { name: "USERS", status: 1 },
  {
    name: "PRODUCTS",
    status: 1,
  },
  {
    name: "ORDERS",
    status: 1,
  },
];
export const rolesData: Role[] = [
  {
    name: "SELLER",
    alias: "Vendedor(a)",
    permissions: [],
    status: 1,
    updated_date: generateUTCToLimaDate(),
    created_date: generateUTCToLimaDate(),
  },
  {
    name: "ADMIN",
    alias: "Administrador(a)",
    permissions: [],
    status: 1,
    updated_date: generateUTCToLimaDate(),
    created_date: generateUTCToLimaDate(),
  },
  {
    name: "GLOBAL_ADMIN",
    alias: "Super Administrador(a)",
    permissions: [],
    status: 1,
    updated_date: generateUTCToLimaDate(),
    created_date: generateUTCToLimaDate(),
  },
];
export const gendersData: Gender[] = [
  {
    name: "Hombre",
    status: 1,
  },
  {
    name: "Mujer",
    status: 1,
  },
  {
    name: "Otro",
    status: 1,
  },
  {
    name: "Prefiero no decirlo",
    status: 1,
  },
];

export const categoriesData: Category[] = [
  {
    name: "Bebidas",
    description:
      "Categoría que enfoca a todo lo  que son bebidas como refrescos, vinos, cocteles, etc.",
    status: 1,
  },
  {
    name: "Entradas",
    description: "Categoría enfocada a los platos de entrada.",
    status: 1,
  },
  {
    name: "A la carta",
    description: "Categoría enfocada a los platos principales a la carta.",
    status: 1,
  },
  {
    name: "Menú",
    description:
      "Categoría enfocada a los platos que son el menú del día a día.",
    status: 1,
  },
  {
    name: "Combos",
    description:
      "Categoría enfocada a los platos que incluyen bebidas, plato fuerte, y postre (la selección de platos puede variar).",
    status: 1,
  },
  {
    name: "Postres",
    description: "Categoría enfocada a los postres.",
    status: 1,
  },
];

export const documentTypesData: DocumentTypeDB[] = [
  {
    name: "DNI",
    operation: "IDENTITY",
    status: 1,
    code: "DNI",
    sequential: 0,
    length: 0,
    regex: "/^[d]{8}$/",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "RUC",
    operation: "IDENTITY",
    status: 1,
    code: "RUC",
    sequential: 0,
    length: 0,
    regex: "/^(10|20)[0-9]{9}$/",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Carnet de Diplomacia",
    operation: "IDENTITY",
    status: 1,
    code: "CDI",
    sequential: 0,
    length: 0,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Carnet de Extranjería",
    operation: "IDENTITY",
    status: 1,
    code: "CEX",
    sequential: 0,
    length: 0,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Orden",
    operation: "TRANSACTION",
    status: 1,
    code: "O001",
    sequential: 0,
    length: 8,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Venta",
    operation: "TRANSACTION",
    status: 1,
    code: "V001",
    sequential: 0,
    length: 8,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
];

export const chargesData: Charge[] = [
  {
    name: "Mesero",
    min_salary: 930.0,
    max_salary: 2100.0,
    description: "",
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Recepcionista",
    min_salary: 1500.0,
    max_salary: 4000.0,
    description: "",
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Gerente",
    min_salary: 4000.0,
    max_salary: 10000.0,
    description: "",
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Jefe de cocina",
    min_salary: 2500.0,
    max_salary: 8000.0,
    description: "",
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
];

export const receptionData: Reception[] = [
  {
    code: "R000000",
    available: 1,
    status: 1,
    number_table: "000",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    code: "R000001",
    available: 1,
    status: 1,
    number_table: "001",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    code: "R000002",
    available: 1,
    status: 1,
    number_table: "002",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    code: "R000003",
    available: 1,
    status: 1,
    number_table: "003",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    code: "R000004",
    available: 1,
    status: 1,
    number_table: "004",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
];

export const EMAIL_PABLO_SYS = "pablojamiro2008@gmail.com";
export const EMAIL_PABLO_USER = "pablojamiro2008@hotmail.com";
export const EMAIL_POL_SYS = "reyesm.pol@gmail.com";
export const EMAIL_POL_USER = "wpol.reyes@gmail.com";
const GENERIC_PASSWORD = "12345678";

export const systemUsersData: SystemUser[] = [
  {
    email: EMAIL_PABLO_SYS,
    password: GENERIC_PASSWORD,
    first_name: "Pablo",
    last_name: "Urbano",
    photo: "",
    status: 1,
    verified: 1,
    role: undefined,
    user_creator: null,
    account_suspension_day: undefined,
    access_token: "",
    refresh_token: "",
    validation_token: "",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    email: EMAIL_POL_SYS,
    password: GENERIC_PASSWORD,
    first_name: "Pol Reyes",
    last_name: "Reyes",
    photo: "",
    status: 1,
    verified: 1,
    role: undefined,
    user_creator: null,
    account_suspension_day: undefined,
    access_token: "",
    refresh_token: "",
    validation_token: "",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
];

export const usersData: User[] = [
  {
    first_name: "Pablo Jamiro",
    last_name: "Urbano",
    second_last_name: "",
    document_type: undefined,
    document_number: "",
    cellphone_number: "",
    address: "",
    gender: undefined,
    email: EMAIL_PABLO_USER,
    password: GENERIC_PASSWORD,
    verified: 1,
    photo: "",
    token: "",
    status: 1,
    tokens: [],
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    first_name: "Pol Wilmer",
    last_name: "Reyes",
    second_last_name: "Mamani",
    document_type: undefined,
    document_number: "",
    cellphone_number: "",
    address: "",
    gender: undefined,
    email: EMAIL_POL_USER,
    password: GENERIC_PASSWORD,
    verified: 1,
    photo: "",
    token: "",
    status: 1,
    tokens: [],
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
];

export const productsData: Product[] = [
  {
    name: "Arroz con mariscos",
    available: 1,
    description: "",
    category: undefined,
    price: 50.0,
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Vino tinto 1l",
    available: 1,
    description: "",
    category: undefined,
    price: 50.0,
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
];
