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

}