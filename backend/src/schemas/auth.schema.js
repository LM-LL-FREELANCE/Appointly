import { z } from 'zod'

const dniSchema = z.string().trim().regex(/^\d{7,8}$/, 'DNI inválido')

export const loginSchema = z.strictObject({
  dni: dniSchema,
  password: z.string().min(1, "Password is required"),
  role: z.enum(['cliente', 'profesional', 'admin'])
})

export const registerSchema = z.strictObject({
  dni: dniSchema,
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  correo: z.email().max(255),
  genero: z.enum(["M", "F", "X"]),
  fecha_nacimiento: z.iso.date(),
  password: z.string().min(6),
  confirm: z.string(),
  telefono: z.string().trim().max(30).nullish(),
  id_obra_social: z.number().nullish(),
  numero_afiliado: z.string().trim().max(30).nullish(),
}).refine((data) => data.password === data.confirm, {
  error: "Las contraseñas no coinciden",
  path: ["confirm"],
}).refine((data) => {
  if (!data.numero_afiliado) return true
  return data.id_obra_social != null
}, {
  error: "El número de afiliado requiere una obra social",
  path: ["numero_afiliado"],
})

export const registerProfesionalSchema = z.object({
  dni: dniSchema,
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  correo: z.email().max(255),
  genero: z.enum(["M", "F", "X"]),
  fecha_nacimiento: z.iso.date(),
  password: z.string().min(6),
  confirm: z.string(),
  telefono: z.string().trim().max(30).nullish(),
}).refine((data) => data.password === data.confirm, {
  error: "Las contraseñas no coinciden",
  path: ["confirm"],
})
