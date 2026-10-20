import { z } from "zod"
import { fechaEnDias } from "../utils/time.js"

// WS3 — avisos del centro (PLAN_ADMIN.md §8.2 C3–C7).

export const idAvisoSchema = z.coerce.number().int().positive()

const esFechaReal = (s) => fechaEnDias(0, s) === s // rechaza 2030-02-30

const fechaOpcional = z.preprocess(
  (valor) => (valor === "" ? null : valor),
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
    .refine(esFechaReal, "La fecha no existe")
    .nullable()
    .optional(),
)

export const avisoSchema = z.strictObject({
  titulo: z.string().trim()
    .min(1, "El título es obligatorio")
    .max(150, "El título no puede superar los 150 caracteres"),
  mensaje: z.string().trim()
    .min(1, "El mensaje es obligatorio")
    .max(20_000, "El mensaje es demasiado largo"),
  tipo: z.enum(["info", "advertencia", "critico"], { error: "Tipo de aviso inválido" }),
  activo: z.boolean().default(true),
  vigente_desde: fechaOpcional,
  vigente_hasta: fechaOpcional,
}).superRefine((data, ctx) => {
  if (data.vigente_desde && data.vigente_hasta && data.vigente_desde > data.vigente_hasta) {
    ctx.addIssue({
      code: "custom",
      path: ["vigente_hasta"],
      message: "La fecha hasta no puede ser anterior a la fecha desde",
    })
  }
})
