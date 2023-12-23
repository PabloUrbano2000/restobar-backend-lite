import config from "../config";
import { generateUTCToLimaDate } from "../helpers/generators";
import { OPERATION_TYPE } from "../models/DocumentType";
import {
  Setting,
  Module,
  Role,
  SystemUser,
  Category,
  Product,
  Gender,
  DocumentTypeDB,
  User,
  Reception,
} from "../models/Entities";

import {
  CATEGORIES,
  DOCUMENT_TYPE_DNI,
  EMAIL_PABLO_SYS,
  EMAIL_PABLO_USER,
  EMAIL_POL_SYS,
  EMAIL_POL_USER,
  GENDER_MAN,
  GENERIC_PASSWORD,
  MODULES,
  ROLES,
} from "./constants";

export const settingsData: Setting[] = [
  {
    opening_time: "06:00:00",
    closing_time: "20:00:00",
    system_manual: "",
    tax: 0.18,
    ruc: "",
    business_name: "Restobar admin S.A.C.",
    address: "Jirón Las Magnolias 500, Lima",
    user_double_opt_in: config.DOUBLE_OPT_IN_USER as 1 | 0,
    system_user_double_opt_in: config.DOUBLE_OPT_IN_SYS as 1 | 0,
    created_date: generateUTCToLimaDate(),
    status: 1,
    user_creator: null,
    last_publication_date: generateUTCToLimaDate(),
    last_user_publisher: null,
  },
];

export const modulesData: Module[] = [
  { name: MODULES.RECEPTIONS, status: 1 },
  { name: MODULES.ROLES, status: 1 },
  {
    name: MODULES.SYSTEM_USERS,
    status: 1,
  },
  { name: MODULES.USERS, status: 1 },
  {
    name: MODULES.PRODUCTS,
    status: 1,
  },
  {
    name: MODULES.ORDERS,
    status: 1,
  },
];
export const rolesData: Role[] = [
  {
    name: ROLES.CHEF,
    alias: "Cocinero(a)",
    permissions: [],
    status: 1,
    updated_date: generateUTCToLimaDate(),
    created_date: generateUTCToLimaDate(),
  },
  {
    name: ROLES.WAITER,
    alias: "Mesero(a)",
    permissions: [],
    status: 1,
    updated_date: generateUTCToLimaDate(),
    created_date: generateUTCToLimaDate(),
  },
  {
    name: ROLES.ADMIN,
    alias: "Administrador(a)",
    permissions: [],
    status: 1,
    updated_date: generateUTCToLimaDate(),
    created_date: generateUTCToLimaDate(),
  },
  {
    name: ROLES.GLOBAL_ADMIN,
    alias: "Super Administrador(a)",
    permissions: [],
    status: 1,
    updated_date: generateUTCToLimaDate(),
    created_date: generateUTCToLimaDate(),
  },
];
export const gendersData: Gender[] = [
  {
    name: GENDER_MAN,
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
    name: CATEGORIES.BEBIDAS,
    description:
      "Categoría que enfoca a todo lo  que son bebidas como refrescos, vinos, cocteles, etc.",
    status: 1,
  },
  {
    name: CATEGORIES.ENTRADAS,
    description: "Categoría enfocada a los platos de entrada.",
    status: 1,
  },
  {
    name: CATEGORIES.A_LA_CARTA,
    description: "Categoría enfocada a los platos principales a la carta.",
    status: 1,
  },
  {
    name: CATEGORIES.MENU,
    description:
      "Categoría enfocada a los platos que son el menú del día a día.",
    status: 1,
  },
  {
    name: CATEGORIES.COMBOS,
    description:
      "Categoría enfocada a los platos que incluyen bebidas, plato fuerte, y postre (la selección de platos puede variar).",
    status: 1,
  },
  {
    name: CATEGORIES.POSTRES,
    description: "Categoría enfocada a los postres.",
    status: 1,
  },
];

export const documentTypesData: DocumentTypeDB[] = [
  {
    name: DOCUMENT_TYPE_DNI,
    operation: OPERATION_TYPE.IDENTITY,
    status: 1,
    code: "DNI",
    sequential: 0,
    length: 0,
    regex: "^(0-9){8}$",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "RUC",
    operation: OPERATION_TYPE.IDENTITY,
    status: 1,
    code: "RUC",
    sequential: 0,
    length: 0,
    regex: "^(10|20)[0-9]{9}$",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Carnet de Diplomacia",
    operation: OPERATION_TYPE.IDENTITY,
    status: 1,
    code: "CDI",
    sequential: 0,
    length: 0,
    regex: "^([a-zA-Z0-9-]{9,15})$",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Carnet de Extranjería",
    operation: OPERATION_TYPE.IDENTITY,
    status: 1,
    code: "CEX",
    sequential: 0,
    length: 0,
    regex: "^([a-zA-Z0-9-]{9,15})$",
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Orden",
    operation: OPERATION_TYPE.TRANSACTION,
    status: 1,
    code: "O001",
    sequential: 0,
    length: 8,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Venta",
    operation: OPERATION_TYPE.TRANSACTION,
    status: 1,
    code: "V001",
    sequential: 0,
    length: 8,
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

export const systemUsersData: SystemUser[] = [
  {
    email: EMAIL_PABLO_SYS,
    password: GENERIC_PASSWORD,
    first_name: "Pablo",
    last_name: "Urbano",
    photo: "",
    status: 1,
    verified: 1,
    // role: undefined,
    // user_creator: null,
    // account_suspension_day: undefined,
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
    // role: undefined,
    // user_creator: null,
    // account_suspension_day: undefined,
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
    // document_type: undefined,
    document_number: "",
    cellphone_number: "",
    address: "",
    // gender: undefined,
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
    // document_type: undefined,
    document_number: "",
    cellphone_number: "",
    address: "",
    // gender: undefined,
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

export const productsMenuData: Product[] = [
  {
    name: "Salchipapa",
    available: 1,
    description: "",
    // category: undefined,
    price: 30.0,
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Alitas BBQ",
    available: 1,
    description: "",
    // category: undefined,
    price: 20.0,
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
];

export const productsBeveragesData: Product[] = [
  {
    name: "Pisco Sour",
    available: 1,
    description: "",
    // category: undefined,
    price: 20.0,
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Machu Picchu",
    available: 1,
    description: "",
    // category: undefined,
    price: 20.0,
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
  {
    name: "Cerveza",
    available: 1,
    description: "",
    // category: undefined,
    price: 10.0,
    status: 1,
    created_date: generateUTCToLimaDate(),
    updated_date: generateUTCToLimaDate(),
  },
];
