import { Resend } from 'resend';

// Created on first use so the server can boot without the key (e.g. in dev
// without email) and only fails when an email is actually sent.
let resendClient;
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Falta la variable de entorno RESEND_API_KEY.');
  }
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Shared sender for the account/invitation emails: one place for the
// from/error handling instead of repeating it per message.
const sendMail = async ({ to, subject, html, errorLabel }) => {
  const { data, error } = await getResend().emails.send({ from: process.env.EMAIL_FROM, to, subject, html });

  if (error) {
    console.error(`Error de Resend (${errorLabel}):`, error);
    throw new Error(`No se pudo enviar el correo (${errorLabel}): ${error.message}`);
  }

  return data;
};

export class EmailMethods {
  static async sendTest() {
    await getResend().emails.send({
      from: 'delivered@resend.dev',
      to: 'lucalatigano12@gmail.com',
      subject: 'Hello World',
      html: '<p>You have login in your account in appointly</p>'
    });
  }

  static async resetPassWord({ correo, link }) {
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM,
      to: correo,
      subject: "Cambiar contraseña",
      html: `
      <p>Hola, has solicitado cambiar tu contraseña de la página Appointly.</p>
      <p>Para poder realizar el cambio, haz click en el siguiente enlace:</p>
      <a href="${link}">${link}</a>
      <p>Este lo redirigirá a nuestra web y ahí podrá hacer el cambio con la nueva contraseña.</p>
      <p>Gracias, consultorio Appointly</p>
      `
    });

    if (error) {
      console.error("Error de Resend:", error);
      throw new Error(`No se pudo enviar el correo: ${error.message}`);
    }

    return data;
  }

  static async invitacion({ correo, role = 'admin', link, horas }) {
    const esProfesional = role === 'profesional';
    const rolTexto = esProfesional ? 'profesional' : 'administrador';
    const subject = esProfesional
      ? 'Invitación para sumarte como profesional en Appointly'
      : 'Invitación para administrar Appointly';

    return sendMail({
      to: correo,
      subject,
      errorLabel: 'invitación',
      html: `
      <p>Hola, te invitaron a crear una cuenta de ${rolTexto} en Appointly.</p>
      <p>Para completar el registro, hacé click en el siguiente enlace:</p>
      <a href="${link}">${link}</a>
      <p>El enlace es válido por ${horas} horas y solo puede usarse una vez.</p>
      <p>Si no esperabas esta invitación, ignorá este mensaje.</p>
      <p>Gracias, consultorio Appointly</p>
      `,
    });
  }

  static async invitacionAdmin(params) {
    return EmailMethods.invitacion({ ...params, role: 'admin' });
  }

  static async turnoCanceladoPorProfesional({ turno, motivo }) {
    const fecha = new Date(turno.fecha_turno).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const hora = turno.hora_turno?.slice(0, 5);

    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM,
      to: turno.c_correo,
      subject: 'Tu turno fue cancelado',
      html: `
        <p>Hola <strong>${turno.c_nombre}</strong>,</p>
        <p>Te informamos que tu turno del día <strong>${fecha}</strong> a las <strong>${hora} hs</strong> con el profesional <strong>${turno.p_nombre} ${turno.p_apellido}</strong> ha sido cancelado.</p>
        ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
        <p>Podés ingresar a la plataforma para reprogramar tu turno cuando desees.</p>
        <p>Saludos,<br>Equipo de Appointly</p>
      `,
    });

    if (error) {
      console.error("Error de Resend al cancelar turno:", error);
      throw new Error(`No se pudo enviar el correo de cancelación: ${error.message}`);
    }

    return data;
  }

  static async turnoCanceladoPorCliente({ turno }) {
    const fecha = new Date(turno.fecha_turno).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const hora = turno.hora_turno?.slice(0, 5);

    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM,
      to: turno.c_correo,
      subject: 'Cancelaste tu turno',
      html: `
        <p>Hola <strong>${turno.c_nombre}</strong>,</p>
        <p>Confirmamos la cancelacion de tu turno del día <strong>${fecha}</strong> a las <strong>${hora} hs</strong> con el profesional <strong>${turno.p_nombre} ${turno.p_apellido}</strong>.</p>
        <p>Podés volver a reservar cuando quieras desde la plataforma.</p>
        <p>Saludos,<br>Equipo de Appointly</p>
      `,
    });

    if (error) {
      console.error("Error de Resend al cancelar turno por cliente:", error);
      throw new Error(`No se pudo enviar el correo de cancelación: ${error.message}`);
    }

    return data;
  }

}