import { z } from "zod"
import { fechaEnDias } from "../utils/time.js"

const esFechaReal = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && fechaEnDias(0, s) === s

const fechaSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.")
  .refine(esFechaReal, "La fecha no es válida.")

const horaOpcionalSchema = z
  .union([
    z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener formato HH:MM."),
    z.literal(""),
  ])
  .nullish()
  .transform((v) => (v ? v : null))

export const idBloqueoSchema = z.coerce.number().int().positive()

export const listarBloqueosQuerySchema = z
  .object({
    desde: fechaSchema.optional(),
    hasta: fechaSchema.optional(),
    profesional: z
      .union([z.coerce.number().int().positive(), z.literal("")])
      .nullish()
      .transform((v) => (v === "" || v === undefined || v === null ? null : Number(v))),
  })
  .refine((d) => !d.desde || !d.hasta || d.desde <= d.hasta, {
    message: '"desde" no puede ser posterior a "hasta".',
    path: ["desde"],
  })

export const crearBloqueoSchema = z
  .object({
    fechas: z
      .array(fechaSchema)
      .min(1, "Seleccioná al menos una fecha.")
      .max(62, "No se pueden bloquear más de 62 fechas a la vez.")
      .transform((arr) => [...new Set(arr)].sort()),
    hora_inicio: horaOpcionalSchema,
    hora_fin: horaOpcionalSchema,
    dni_profesional: z
      .union([z.coerce.number().int().positive(), z.literal("")])
      .nullish()
      .transform((v) => (v === "" || v === undefined || v === null ? null : Number(v))),
    motivo: z
      .string()
      .trim()
      .max(255, "El motivo no puede superar los 255 caracteres.")
      .nullish()
      .transform((v) => v || null),
  })
  .superRefine((data, ctx) => {
    const tieneInicio = data.hora_inicio !== null
    const tieneFin = data.hora_fin !== null

    if (tieneInicio !== tieneFin) {
      ctx.addIssue({
        code: "custom",
        path: [tieneInicio ? "hora_fin" : "hora_inicio"],
        message: "Indicá tanto la hora de inicio como la de fin, o dejá ambas vacías para bloquear todo el día.",
      })
      return
    }

    if (tieneInicio && tieneFin && data.hora_inicio >= data.hora_fin) {
      ctx.addIssue({
        code: "custom",
        path: ["hora_fin"],
        message: "La hora de fin debe ser posterior a la hora de inicio.",
      })
    }
  })
