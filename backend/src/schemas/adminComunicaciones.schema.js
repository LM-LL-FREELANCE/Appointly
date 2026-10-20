import { z } from "zod"
import { fechaEnDias } from "../utils/time.js"

// Segmentos del centro de comunicaciones (PLAN §8.5, M2/M4).
export const SEGMENTOS = ["todos", "profesionales", "clientes_turnos_activos"]

const esFechaReal = (s) => fechaEnDias(0, s) === s // rejects 2030-02-30 (Date would roll it over)

const fechaSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "fecha debe ser YYYY-MM-DD")
  .refine(esFechaReal, "la fecha no existe")

const asuntoSchema = z.string().trim()
  .min(1, "El asunto es obligatorio")
  .max(255, "El asunto no puede superar los 255 caracteres")

const mensajeSchema = z.string().trim()
  .min(1, "El mensaje es obligatorio")
  .max(10000, "El mensaje es demasiado largo")

// El segmento de clientes con turnos exige el rango, y si viene, debe estar ordenado.
const refinarRango = (data, ctx) => {
  // El masivo usa `segmento` y el preview usa `tipo`: misma regla para ambos.
  const segmento = data.segmento ?? data.tipo

  if (segmento === "clientes_turnos_activos" && (!data.desde || !data.hasta)) {
    ctx.addIssue({ code: "custom", path: ["desde"], message: "Este segmento requiere un rango de fechas" })
  }
  if (data.desde && data.hasta && data.desde > data.hasta) {
    ctx.addIssue({ code: "custom", path: ["desde"], message: "La fecha desde no puede ser posterior a la hasta" })
  }
}

export const enviarIndividualSchema = z.strictObject({
  dni: z.coerce.number({ error: "DNI inválido" }).int("DNI inválido")
    .min(1_000_000, "DNI inválido").max(99_999_999, "DNI inválido"),
  rol: z.enum(["cliente", "profesional", "admin"], { error: "Rol inválido" }),
  asunto: asuntoSchema,
  mensaje: mensajeSchema,
})

export const enviarMasivoSchema = z.strictObject({
  segmento: z.enum(SEGMENTOS, { error: "Segmento inválido" }),
  desde: fechaSchema.optional(),
  hasta: fechaSchema.optional(),
  asunto: asuntoSchema,
  mensaje: mensajeSchema,
}).superRefine(refinarRango)

export const previewSegmentoSchema = z.object({
  tipo: z.enum(SEGMENTOS, { error: "Segmento inválido" }),
  desde: fechaSchema.optional(),
  hasta: fechaSchema.optional(),
}).superRefine(refinarRango)
