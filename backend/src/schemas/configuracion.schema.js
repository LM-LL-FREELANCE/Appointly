import { z } from "zod"

// C1/C2 — configuración general (PLAN_ADMIN.md §6.2 / §8.2).
// El PUT es de reemplazo completo: todos los campos viajan en cada guardado.

const horaSchema = z.string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener formato HH:MM")

const horaOpcional = z.preprocess(
  (valor) => (valor === "" ? null : valor),
  horaSchema.nullable(),
)

const textoOpcional = (max, schema = z.string()) => z.preprocess(
  (valor) => {
    if (typeof valor !== "string") return valor
    const limpio = valor.trim()
    return limpio === "" ? null : limpio
  },
  schema.max(max).nullable(),
)

const diasHabilesSchema = z.array(z.number().int().min(0).max(6))
  .min(1, "Seleccioná al menos un día hábil")
  .max(7)
  .refine((dias) => new Set(dias).size === dias.length, "No puede haber días repetidos")

export const configuracionSchema = z.strictObject({
  nombre_centro: z.string().trim()
    .min(1, "El nombre del centro es obligatorio")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  telefono: textoOpcional(30),
  email_institucional: textoOpcional(255, z.email("El correo no es válido")),
  direccion: textoOpcional(255),
  anticipacion_reserva_min: z.coerce.number().int().min(0).max(43_200),
  limite_cancelacion_horas: z.coerce.number().int().min(0).max(720),
  dias_habiles: diasHabilesSchema,
  hora_apertura: horaOpcional,
  hora_cierre: horaOpcional,
}).superRefine((data, ctx) => {
  const { hora_apertura: apertura, hora_cierre: cierre } = data

  if ((apertura === null) !== (cierre === null)) {
    ctx.addIssue({
      code: "custom",
      path: ["hora_apertura"],
      message: "Apertura y cierre deben venir juntos (o ambos vacíos)",
    })
    return
  }

  if (apertura && cierre && apertura >= cierre) {
    ctx.addIssue({
      code: "custom",
      path: ["hora_cierre"],
      message: "El cierre debe ser posterior a la apertura",
    })
  }
})
