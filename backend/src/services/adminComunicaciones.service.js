import { AdminComunicacionesModel } from "../models/adminComunicaciones.model.js"
import { EmailMethods } from "../emails/email.methods.js"
import { AppError } from "../utils/AppError.js"

const MUESTRA_MAX = 10

export class AdminComunicacionesService {
  /** Preview de segmento: cantidad total + una muestra chica de correos. */
  static async previewSegmento(tipo, { desde, hasta }) {
    const correos = await AdminComunicacionesModel.correosDeSegmento(tipo, { desde, hasta })

    return { cantidad: correos.length, muestra: correos.slice(0, MUESTRA_MAX) }
  }

  /**
   * Comunicado individual: resuelve el correo de la cuenta (dni + rol), envía y
   * SIEMPRE deja la fila en el historial, incluso si Resend falla. Un fallo de
   * envío termina en 502 EMAIL_SEND_FAILED para que la UI lo muestre.
   */
  static async enviarIndividual({ dni, rol, asunto, mensaje }, adminDni) {
    const cuenta = await AdminComunicacionesModel.findCuenta({ dni, rol })
    if (!cuenta) {
      throw new AppError("No existe una cuenta con ese DNI y ese rol.", 404, "NOT_FOUND")
    }

    let exitos = 0
    let fallos = 0
    try {
      await EmailMethods.comunicado({ correo: cuenta.correo, asunto, mensaje })
      exitos = 1
    } catch (error) {
      fallos = 1
      console.error("Error al enviar comunicado individual:", error)
    }

    const id = await AdminComunicacionesModel.insertEnvio({
      dni_admin: adminDni,
      tipo: "individual",
      segmento: null,
      segmento_params: null,
      destinatarios: [cuenta.correo],
      cantidad: 1,
      exitos,
      fallos,
      asunto,
      cuerpo: mensaje,
    })

    if (fallos > 0) {
      throw new AppError("No pudimos enviar el correo. Probá de nuevo en unos minutos.", 502, "EMAIL_SEND_FAILED")
    }

    return { id, correo: cuenta.correo, cantidad: 1, exitos, fallos }
  }

  /**
   * Comunicado masivo: resuelve los correos del segmento (excluye bajas y
   * suspendidos), envía por lotes de 100 y registra los conteos en el historial.
   * Segmento vacío → 422 SEGMENT_EMPTY (no se gasta un envío del rate limit).
   */
  static async enviarMasivo({ segmento, desde, hasta, asunto, mensaje }, adminDni) {
    const correos = await AdminComunicacionesModel.correosDeSegmento(segmento, { desde, hasta })
    if (correos.length === 0) {
      throw new AppError("El segmento seleccionado no tiene destinatarios.", 422, "SEGMENT_EMPTY")
    }

    const { exitos, fallos } = await EmailMethods.comunicadoLote({
      destinatarios: correos,
      asunto,
      mensaje,
    })

    const id = await AdminComunicacionesModel.insertEnvio({
      dni_admin: adminDni,
      tipo: "masivo",
      segmento,
      segmento_params: segmento === "clientes_turnos_activos" ? { desde, hasta } : null,
      destinatarios: correos,
      cantidad: correos.length,
      exitos,
      fallos,
      asunto,
      cuerpo: mensaje,
    })

    return { id, cantidad: correos.length, exitos, fallos }
  }

  static listHistorial() {
    return AdminComunicacionesModel.listHistorial()
  }
}
