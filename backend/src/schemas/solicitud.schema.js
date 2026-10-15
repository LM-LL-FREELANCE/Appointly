import { z } from "zod"

export const solicitudParamsSchema = z.strictObject({
  dni: z.string().regex(/^\d{7,8}$/, "DNI inválido"),
  role: z.enum(["profesional", "admin"]),
})

export const resolverSolicitudSchema = z.strictObject({
  accion: z.enum(["aprobar", "rechazar"], { error: "La acción debe ser aprobar o rechazar" }),
})
