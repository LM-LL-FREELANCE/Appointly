import { z } from 'zod'

const dniSchema = z.string().trim().regex(/^\d{7,8}$/, 'DNI inválido')

export const loginSchema = z.strictObject({
  dni: dniSchema,
  password: z.string().min(1, "Password is required"),
  role: z.enum(['cliente', 'profesional', 'admin'])
})

// Fields shared by every account type. Role-specific fields are added below.
export const baseAccountShape = {
  dni: dniSchema,
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  apellido: z.string().trim().min(1, "El apellido es obligatorio").max(100),
  correo: z.string().trim().email("El correo no es válido").max(255),
  genero: z.enum(["M", "F", "X"], { error: "El género debe ser M, F o X" }),
  fecha_nacimiento: z.iso.date(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirm: z.string(),
  telefono: z.string().trim().max(30).nullish(),
  // Only needed when the DNI already belongs to a person with an active
  // account: proves the requester knows that account (see AccountService).
  password_cuenta_existente: z.string().min(1).nullish(),
}

export const passwordsMatch = (data) => data.password === data.confirm
export const passwordsMatchError = { error: "Las contraseñas no coinciden", path: ["confirm"] }

const clienteShape = {
  ...baseAccountShape,
  role: z.literal("cliente"),
  id_obra_social: z.number().nullish(),
  numero_afiliado: z.string().trim().max(30).nullish(),
}

// Public registration: only `cliente` can self-register. Profesional and admin
// accounts are created exclusively through invitations.
export const registerSchema = z.preprocess(
  (body) => (body && typeof body === "object" && !("role" in body) ? { ...body, role: "cliente" } : body),
  z.strictObject({
    ...clienteShape,
    role: z.literal("cliente"),
  })
    .refine(passwordsMatch, passwordsMatchError)
    .refine((data) => {
      if (!data.numero_afiliado) return true
      return data.id_obra_social != null
    }, {
      error: "El número de afiliado requiere una obra social",
      path: ["numero_afiliado"],
    })
)

export const passwordsSchema = z.strictObject({
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string(),
  token: z.string({ required_error: "El token es obligatorio" })
}).refine((datos) => datos.password === datos.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});
