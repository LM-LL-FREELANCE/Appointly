/**
 * Punto ÚNICO de integración de emails.
 *
 * Hoy NO envía nada: solo deja registro en consola de qué email se mandaría.
 * Cuando quieran conectar un proveedor real (nodemailer / Resend / SES),
 * lo único que hay que cambiar es el cuerpo de #enviar(): armar el transporte
 * y reemplazar el console.log por el envío real. El resto del código
 * (controllers/services) ya lo llama en los lugares correctos.
 */
export class EmailService {

  // Envío genérico. Por ahora es un stub que loguea.
  static async #enviar({ para, asunto, cuerpo }) {
    if (!para) {
      // Sin destinatario no hay a dónde mandar; lo avisamos pero no rompemos el flujo.
      console.warn('[email:pendiente] Se intentó enviar un email sin destinatario. Asunto:', asunto)
      return
    }
    // TODO(emails): reemplazar por el envío real con el proveedor elegido.
    console.log('[email:pendiente]', { para, asunto, cuerpo })
  }

  /**
   * Turno cancelado POR EL PROFESIONAL -> se le avisa al CLIENTE.
   * `motivo` es opcional (lo escribe el profesional en el modal de cancelar).
   */
  static async turnoCanceladoPorProfesional({ turno, motivo }) {
    const cuerpo =
      `Hola ${turno.c_nombre}, tu turno del ${turno.fecha_turno} a las ${turno.hora_turno} ` +
      `con ${turno.p_nombre} ${turno.p_apellido} fue cancelado por el profesional.` +
      (motivo ? `\n\nMotivo: ${motivo}` : '')

    return this.#enviar({
      para: turno.c_correo,
      asunto: 'Tu turno fue cancelado',
      cuerpo,
    })
  }

  /**
   * Turno cancelado POR EL CLIENTE -> confirmación al mismo CLIENTE.
   */
  static async turnoCanceladoPorCliente({ turno }) {
    const cuerpo =
      `Hola ${turno.c_nombre}, confirmamos que cancelaste tu turno del ${turno.fecha_turno} ` +
      `a las ${turno.hora_turno} con ${turno.p_nombre} ${turno.p_apellido}.`

    return this.#enviar({
      para: turno.c_correo,
      asunto: 'Cancelaste tu turno',
      cuerpo,
    })
  }
}
