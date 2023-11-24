import config from "../config";

export const templateEmailSystemRecoveryAccount = ({
  email = "",
  firstName = "",
  lastName = "",
  link = "",
}) => {
  return {
    from: `${config.SMTP_EMAIL}`,
    to: `${email}`,
    subject: "Validación de cuenta",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName ? `${firstName} ${lastName}` : email
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
    subject: "Cuenta verificada",
    html: `
    <p style="margin:0; font-size:14px;">Hola ${
      firstName && lastName ? `${firstName} ${lastName}` : email
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
    subject: "Recupera tu contraseña",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName ? `${firstName} ${lastName}` : email
        },</p>
        <p style="margin:15px 0 0; font-size:13px;">Haz click <a style="" href="${link}">aquí</a> para restaurar tu contraseña.</p>
        <p style="margin:20px 0 0; font-size:13px;">Si no solicitaste cambiar tu contraseña haga caso omiso a este mensaje.</p>
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
    subject: "Contraseña actualizada",
    html: `
        <p style="margin:0; font-size:14px;">Hola ${
          firstName && lastName ? `${firstName} ${lastName}` : email
        },</p>
        <p style="margin:15px 0 0; font-size:13px;">Tu contraseña fue restaurada, por favor ingresa <a style="" href="${link}">aquí</a> para iniciar sesión.</p>
        <br />
        <p style="margin:20px 0 0;font-size: 13px;font-weight: 600;font-style:italic;">"Por favor, no responder. Este es un correo automático, por lo tanto, no será revisado."</p>
        <p style="margin-top: 40px; font-weight: 600;font-size: 13px;">${new Date().getFullYear()} @ RESTOBAR SAC.-<span style="font-weight:500;"> Equipo de soporte</span></p>`,
  };
};
