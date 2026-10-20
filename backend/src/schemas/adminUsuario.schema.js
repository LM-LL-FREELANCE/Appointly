import { z } from "zod"

// WS1 — Gestion de usuarios y cuentas (PLAN §8.3, U1–U7).
// La cuenta se identifica por el par (dni, rol), igual que la sesion.

export const ROLES_CUENTA = ["cliente", "profesional", "admin"]
export const ESTADOS_CUENTA = ["activa", "suspendida", "baja"]

export const dniUsuarioSchema = z.coerce.number().int().positive()
export const rolUsuarioSchema = z.enum(ROLES_CUENTA)

export const listUsuariosQuerySchema = z.object({
  rol: rolUsuarioSchema.optional(),
  estado: z.enum(ESTADOS_CUENTA).optional(),
  q: z.string().trim().max(100, "La busqueda es demasiado larga").optional(),
})

// Cadena opcional que se guarda como NULL cuando viene vacia (el form manda "").
const textoOpcional = (max, msg) => z
  .string()
  .trim()
  .max(max, msg)
  .transform((valor) => (valor === "" ? null : valor))
  .nullish()

const telefono = textoOpcional(30, "El telefono es demasiado largo")

const numeroAfiliado = textoOpcional(30, "El numero de afiliado es demasiado largo")

// Nombre (patron patchClienteData) o id numerico de una obra social existente.
const obraSocial = z.preprocess(
  (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
  z.union([
    z.string().trim().min(1).max(150),
    z.number().int().positive(),
  ]).nullish(),
)

const numeroMatricula = z.string().trim().min(1, "La matricula es obligatoria").max(30)

const duracionTurno = z.coerce.number()
  .int()
  .min(5, "La duracion minima es de 5 minutos")
  .max(240, "La duracion maxima es de 240 minutos")

// Un campo de otro rol no se ignora en silencio: se rechaza con que campo fue.
const mensajeCampoAjeno = (issue) => (
  issue.code === "unrecognized_keys"
    ? `No se puede editar este campo para el rol: ${issue.keys.join(", ")}.`
    : undefined
)

const hayCambios = (data) => Object.keys(data).length > 0
const hayCambiosError = { error: "No hay cambios para guardar." }

// Campos editables por rol (§8.3 U3): cliente -> telefono/obra social/afiliado;
// profesional -> telefono/matricula/duracion; admin -> telefono.
export const clienteUpdateSchema = z.strictObject({
  telefono,
  obra_social: obraSocial,
  numero_afiliado: numeroAfiliado,
}, { error: mensajeCampoAjeno }).refine(hayCambios, hayCambiosError)

export const profesionalUpdateSchema = z.strictObject({
  telefono,
  numero_matricula: numeroMatricula.optional(),
  duracion_turno_min: duracionTurno.optional(),
}, { error: mensajeCampoAjeno }).refine(hayCambios, hayCambiosError)

export const adminUpdateSchema = z.strictObject({
  telefono,
}, { error: mensajeCampoAjeno }).refine(hayCambios, hayCambiosError)

export const updateSchemaPorRol = {
  cliente: clienteUpdateSchema,
  profesional: profesionalUpdateSchema,
  admin: adminUpdateSchema,
}
