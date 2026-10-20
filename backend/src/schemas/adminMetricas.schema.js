import { z } from "zod"
import { ESTADOS_TURNO } from "../config/constants.js"
import { fechaEnDias } from "../utils/time.js"

const esFechaReal = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && fechaEnDias(0, s) === s

const fechaSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.")
  .refine(esFechaReal, "La fecha no es válida.")

export const metricasQuerySchema = z
  .object({
    desde: fechaSchema.optional(),
    hasta: fechaSchema.optional(),
  })
  .refine((d) => !d.desde || !d.hasta || d.desde <= d.hasta, {
    message: '"desde" no puede ser posterior a "hasta".',
    path: ["desde"],
  })

export const reporteTurnosQuerySchema = z
  .object({
    desde: fechaSchema.optional(),
    hasta: fechaSchema.optional(),
    estado: z.enum([...ESTADOS_TURNO, "abiertos"]).optional(),
    profesional: z
      .union([z.coerce.number().int().positive(), z.literal("")])
      .nullish()
      .transform((v) => (v === "" || v === undefined || v === null ? null : Number(v))),
    cliente: z
      .string()
      .trim()
      .max(100)
      .nullish()
      .transform((v) => v || null),
  })
  .refine((d) => !d.desde || !d.hasta || d.desde <= d.hasta, {
    message: '"desde" no puede ser posterior a "hasta".',
    path: ["desde"],
  })
