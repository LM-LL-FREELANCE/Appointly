import { z } from 'zod'

// Challenge emitido por el login admin (JWT purpose 'mfa', PLAN_ADMIN.md §10.2).
const challengeSchema = z.string().trim().min(1, "El desafío es obligatorio")

export const mfaVerificarSchema = z.strictObject({
  challenge: challengeSchema,
  codigo: z.string().trim().regex(/^\d{6}$/, "El código debe tener 6 dígitos"),
})

export const mfaReenviarSchema = z.strictObject({
  challenge: challengeSchema,
})
