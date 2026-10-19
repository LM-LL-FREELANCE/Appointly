import { Resend } from 'resend';
import { aFechaISO } from '../utils/time.js';

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

// Cuerpo compartido de los comunicados: asunto como titulo + mensaje con los
// saltos de linea respetados.
const comunicadoHtml = ({ asunto, mensaje }) => `
  <h2>${escapeHtml(asunto)}</h2>
  ${escapeHtml(mensaje).replace(/\r?\n/g, '<br>')}
  <p>Saludos,<br>Equipo de Appointly</p>
`;

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

// DATE columns arrive as local-midnight Dates; format the calendar day, not the instant.
const formatFecha = (fecha) => {
  const [y, m, d] = aFechaISO(fecha).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
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

  static async turnoReprogramado({ original, nuevo, motivo }) {
    const antes = `${formatFecha(original.fecha_turno)} a las ${original.hora_turno?.slice(0, 5)} hs`;
    const ahora = `${formatFecha(nuevo.fecha_turno)} a las ${nuevo.hora_turno?.slice(0, 5)} hs`;

    return sendMail({
      to: nuevo.c_correo,
      subject: 'Tu turno fue reprogramado',
      errorLabel: 'turno reprogramado',
      html: `
        <p>Hola <strong>${escapeHtml(nuevo.c_nombre)}</strong>,</p>
        <p>Te informamos que tu turno con el profesional <strong>${escapeHtml(nuevo.p_nombre)} ${escapeHtml(nuevo.p_apellido)}</strong> fue reprogramado.</p>
        <p><strong>Antes:</strong> ${escapeHtml(antes)}<br><strong>Ahora:</strong> ${escapeHtml(ahora)}</p>
        ${motivo ? `<p><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>` : ''}
        <p>Si el nuevo horario no te sirve, podés cancelar el turno desde la aplicación.</p>
        <p>Saludos,<br>Equipo de Appointly</p>
      `,
    });
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

  // ---- Panel de administracion (PLAN_ADMIN.md) ----

  /**
   * Segundo factor del admin: codigo de 6 digitos con TTL corto.
   */
  static async mfaCodigo({ correo, codigo, minutos }) {
    return sendMail({
      to: correo,
      subject: 'Tu código de acceso',
      errorLabel: 'código de verificación',
      html: `
      <p>Tu código de verificación para entrar al panel de Appointly es:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px;">${escapeHtml(codigo)}</p>
      <p>Vence en ${minutos} minutos y se puede usar una sola vez.</p>
      <p>Nadie de Appointly te va a pedir este código. Si no intentaste iniciar sesión, ignorá este mensaje.</p>
      `,
    });
  }

  /**
   * Cancelacion hecha por un admin: avisa a AMBAS partes (cliente y
   * profesional) por la misma cancelacion.
   */
  static async turnoCanceladoPorAdmin({ turno, motivo }) {
    const fecha = new Date(turno.fecha_turno).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const hora = turno.hora_turno?.slice(0, 5);
    const motivoHtml = motivo ? `<p><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>` : '';

    const enviar = (to, nombre, contraparte) => sendMail({
      to,
      subject: 'Tu turno fue cancelado',
      errorLabel: 'cancelación por admin',
      html: `
        <p>Hola <strong>${escapeHtml(nombre)}</strong>,</p>
        <p>La administración del centro canceló el turno del día <strong>${fecha}</strong> a las <strong>${hora} hs</strong> entre <strong>${escapeHtml(contraparte)}</strong>.</p>
        ${motivoHtml}
        <p>Si necesitás reprogramar, podés hacerlo desde la plataforma.</p>
        <p>Saludos,<br>Equipo de Appointly</p>
      `,
    });

    const [cliente, profesional] = await Promise.all([
      enviar(turno.c_correo, turno.c_nombre, `${turno.p_nombre} ${turno.p_apellido}`),
      enviar(turno.p_correo, `${turno.p_nombre} ${turno.p_apellido}`, `${turno.c_nombre} ${turno.c_apellido}`),
    ]);

    return { cliente, profesional };
  }

  /**
   * Reasignacion de un turno a otro profesional: avisa al cliente (cambio de
   * profesional) y al profesional nuevo (turno asignado).
   */
  static async turnoReasignado({ turno, profesionalNuevo }) {
    const fecha = new Date(turno.fecha_turno).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const hora = turno.hora_turno?.slice(0, 5);
    const nombreNuevo = `${profesionalNuevo.nombre} ${profesionalNuevo.apellido}`;

    const [cliente, profesional] = await Promise.all([
      sendMail({
        to: turno.c_correo,
        subject: 'Tu turno cambió de profesional',
        errorLabel: 'reasignación al cliente',
        html: `
          <p>Hola <strong>${escapeHtml(turno.c_nombre)}</strong>,</p>
          <p>Tu turno del día <strong>${fecha}</strong> a las <strong>${hora} hs</strong> ahora va a ser con <strong>${escapeHtml(nombreNuevo)}</strong>.</p>
          <p>La fecha y el horario se mantienen. Si tenés alguna duda, contactá a la administración del centro.</p>
          <p>Saludos,<br>Equipo de Appointly</p>
        `,
      }),
      sendMail({
        to: profesionalNuevo.correo,
        subject: 'Te asignaron un turno',
        errorLabel: 'reasignación al profesional',
        html: `
          <p>Hola <strong>${escapeHtml(nombreNuevo)}</strong>,</p>
          <p>La administración del centro te asignó un turno con <strong>${escapeHtml(`${turno.c_nombre} ${turno.c_apellido}`)}</strong> para el día <strong>${fecha}</strong> a las <strong>${hora} hs</strong>.</p>
          <p>Podés verlo en tu agenda.</p>
          <p>Saludos,<br>Equipo de Appointly</p>
        `,
      }),
    ]);

    return { cliente, profesional };
  }

  /**
   * Comunicado individual del centro (asunto + mensaje libres).
   */
  static async comunicado({ correo, asunto, mensaje }) {
    return sendMail({
      to: correo,
      subject: asunto,
      errorLabel: 'comunicado',
      html: comunicadoHtml({ asunto, mensaje }),
    });
  }

  /**
   * Comunicado masivo: usa el batch de Resend en lotes de 100.
   * Devuelve los conteos para el historial (exitos/fallos).
   */
  static async comunicadoLote({ destinatarios, asunto, mensaje }) {
    const CHUNK = 100;
    const html = comunicadoHtml({ asunto, mensaje });
    let exitos = 0;
    let fallos = 0;

    for (let i = 0; i < destinatarios.length; i += CHUNK) {
      const lote = destinatarios.slice(i, i + CHUNK);
      try {
        const { error } = await getResend().batch.send(
          lote.map((to) => ({ from: process.env.EMAIL_FROM, to, subject: asunto, html })),
        );
        if (error) {
          console.error('Error de Resend (comunicado masivo):', error);
          fallos += lote.length;
        } else {
          exitos += lote.length;
        }
      } catch (err) {
        console.error('Error de Resend (comunicado masivo):', err);
        fallos += lote.length;
      }
    }

    return { exitos, fallos };
  }

}