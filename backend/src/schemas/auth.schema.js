import { z } from 'zod'

const dniSchema = z.string().trim().regex(/^\d{7,8}$/, 'DNI inválido')

export const loginSchema = z.strictObject({
  dni: dniSchema,
  password: z.string().min(1, "Password is required")
})