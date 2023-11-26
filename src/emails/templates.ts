import config from "../config";

// PLANTILLAS PARA USUARIOS DE SISTEMA
export const templateEmailSystemWelcome = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
  password = "",
  isValidationEnable = false,
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Bienvenido(a) usuario - RESTOBAR ADMIN",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName
            ? `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
            : email.toUpperCase()
        },</p>
        <p>Hemos generado un usuario con tu correo administrativo para que empieces con tus tareas.</p>

        ${
          isValidationEnable
            ? `
          <p style="margin:15px 0 0; font-size:13px;">Por favor haz click <a style="" href="${link}">aquí</a> para verificar tu cuenta.</p>
          <p style="margin:20px 0 0; font-size:13px;">Este paso es importante para que puedas empezar a realizar tus deberes.</p>
          `
            : `
          <p style="margin:20px 0 0; font-size:13px;">Desde ahora ya puedes empezar a realizar tus deberes.</p>
          <p style="margin:15px 0 0; font-size:13px;">Por favor haz click <a style="" href="${link}">aquí</a> para comenzar.</p>
          `
        }
        <p style="margin:15px 0 0; font-size:13px;">Tu usuario y contraseña son:</p>
        <p style="margin:15px 0 0; font-size:13px;">Usuario: ${email}</p>
        <p style="margin:15px 0 0; font-size:13px;">Password: ${password}</p>
        
        <p style="margin:20px 0 0; font-size:13px;">Recuerda que este paso es importante para que puedas empezar a realizar tus pedidos.</p>
        <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
        <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};

export const templateEmailSystemRecoveryAccount = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Validación de cuenta - RESTOBAR ADMIN",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName
            ? `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
            : email.toUpperCase()
        },</p>
        <p style="margin:15px 0 0; font-size:13px;">Haz click <a style="" href="${link}">aquí</a> para verificar tu cuenta.</p>
        <p style="margin:20px 0 0; font-size:13px;">Recuerda que este paso es importante para que puedas ingresar al sistema.</p>
        <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
        <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};

export const templateEmailSystemVerifyAccount = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Cuenta verificada - RESTOBAR ADMIN",
    html: `
    <p style="margin:0; font-size:14px;">Hola ${
      firstName && lastName
        ? `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
        : email.toUpperCase()
    },</p>
    <p style="margin:15px 0 0; font-size:13px;">Tu cuenta fue verificada, por favor ingresa <a style="" href="${link}">aquí</a> para iniciar sesión.</p>
    <br />
    <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
    <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};

export const templateEmailSystemRecoveryPassword = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Recupera tu contraseña - RESTOBAR ADMIN",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName
            ? `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
            : email.toUpperCase()
        },</p>
        <p style="margin:15px 0 0; font-size:13px;">Haz click <a style="" href="${link}">aquí</a> para restaurar tu contraseña.</p>
        <p style="margin:20px 0 0; font-size:13px;">Si no solicitaste cambiar tu contraseña has caso omiso a este mensaje.</p>
        <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
        <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};

export const templateEmailSystemChangePassword = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Contraseña actualizada - RESTOBAR ADMIN",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName
            ? `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
            : email.toUpperCase()
        },</p>
        <p style="margin:15px 0 0; font-size:13px;">Tu contraseña fue actualizada, por favor ingresa <a style="" href="${link}">aquí</a> para iniciar sesión.</p>
        <br />
        <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
        <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};

// PLANTILLAS PARA EL USUARIO (CLIENTE)
export const templateEmailUserWelcome = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
  isValidationEnable = false,
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Bienvenido(a) a nuestra APP - RESTOBAR SAC",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName
            ? `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
            : email.toUpperCase()
        },</p>
        <p>Es una placer que hayas decidido ser cliente de nuestro negocio :)</p>
        ${
          isValidationEnable
            ? `
          <p style="margin:15px 0 0; font-size:13px;">Por favor haz click <a style="" href="${link}">aquí</a> para verificar tu cuenta.</p>
          <p style="margin:20px 0 0; font-size:13px;">Recuerda que este paso es importante para que puedas empezar a realizar tus pedidos.</p>
          `
            : `
          <p style="margin:20px 0 0; font-size:13px;">Desde ahora ya puedes empezar a realizar tus pedidos. No te olvides de iniciar sesión para comenzar con primera orden :).</p>
          `
        }
        <p style="margin:20px 0 0; font-size:13px;">Recuerda que este paso es importante para que puedas empezar a realizar tus pedidos.</p>
        <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
        <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};

export const templateEmailUserRecoveryAccount = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Verificación de cuenta - RESTOBAR SAC",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName
            ? `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
            : email.toUpperCase()
        },</p>
        <p style="margin:15px 0 0; font-size:13px;">Por favor haz click <a style="" href="${link}">aquí</a> para verificar tu cuenta.</p>
        <p style="margin:20px 0 0; font-size:13px;">Recuerda que este paso es importante para que puedas empezar a realizar tus pedidos.</p>
        <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
        <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};

export const templateEmailUserVerifyAccount = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Cuenta verificada - RESTOBAR SAC",
    html: `
    <p style="margin:0; font-size:14px;">Hola ${
      firstName && lastName
        ? `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
        : email.toUpperCase()
    },</p>
    <p style="margin:15px 0 0; font-size:13px;">Tu cuenta fue verificada con éxito, por favor ingresa  a este enlace <a style="" href="${link}">${link}</a> para iniciar sesión.</p>
    <br />
    <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
    <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};

export const templateEmailUserRecoveryPassword = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Recupera tu contraseña - RESTOBAR SAC",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName ? `${firstName} ${lastName}` : email
        },</p>
        <p style="margin:15px 0 0; font-size:13px;">Haz click <a style="" href="${link}">aquí</a> para restaurar tu contraseña.</p>
        <p style="margin:20px 0 0; font-size:13px;">Si no solicitaste cambiar tu contraseña has caso omiso a este mensaje.</p>
        <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
        <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};

export const templateEmailUserChangePassword = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Contraseña actualizada - RESTOBAR SAC",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName ? `${firstName} ${lastName}` : email
        },</p>
        <p style="margin:15px 0 0; font-size:13px;">Tu contraseña fue actualizada, por favor ingresa <a style="" href="${link}">aquí</a> para iniciar sesión.</p>
        <br />
        <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
        <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};
