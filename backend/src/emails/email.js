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
}