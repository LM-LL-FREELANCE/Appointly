import { Resend } from 'resend';

const resend = new Resend('re_BmALgMJT_6cdx3iBozFXTLKX4bgdXKNoe');

export class EmailMethods {
  static async sendTest() {
    await resend.emails.send({
      from: 'delivered@resend.dev',
      to: 'lucalatigano12@gmail.com',
      subject: 'Hello World',
      html: '<p>You have login in your account in appointly</p>'
    });
  }

  static async resetPassWord({ correo, link }) {
    const { data, error } = await resend.emails.send({
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

  static async turnoCanceladoPorProfesional({ turno, motivo }) {
    const fecha = new Date(turno.fecha_turno).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const hora = turno.hora_turno?.slice(0, 5);

    const { data, error } = await resend.emails.send({
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

    const { data, error } = await resend.emails.send({
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