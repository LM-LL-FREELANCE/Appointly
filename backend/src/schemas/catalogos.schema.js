import { z } from 'zod'

// ABM de catálogos maestros (PLAN_ADMIN.md §8.7 E1–E10).
// Se extienden los recursos existentes: mismas reglas para especialidades y obras sociales.

export const idCatalogoSchema = z.coerce.number().int().positive()

const nombreSchema = (max) => z.string().trim()
  .min(1, 'El nombre es obligatorio')
  .max(max, `El nombre no puede superar los ${max} caracteres`)

// Contrato E3: el recurso especialidad edita `tipo` (columna real).
export const especialidadSchema = z.strictObject({
  tipo: nombreSchema(100),
})

export const obraSocialSchema = z.strictObject({
  nombre_obra_social: nombreSchema(150),
})

// Contrato E4: habilitar/deshabilitar el catálogo sin romper relaciones existentes.
export const estadoCatalogoSchema = z.strictObject({
  activo: z.boolean(),
})
