import { Router } from "express"
import { validate } from "../validators/validate.js"
import { especialidadSchema, estadoCatalogoSchema } from "../schemas/catalogos.schema.js"
import { EspecialidadesController } from "../controllers/especialidades.controller.js"
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js"

export const especialidadesRouter = Router()

// Lectura pública (PLAN §8.7 E1): incluye `activo`; cada consumidor filtra
// donde corresponde (formularios y filtros públicos usan solo activo=1).
especialidadesRouter.get("/", EspecialidadesController.getAll)

// ABM admin (PLAN §8.7 E2–E5). Las escrituras van protegidas; el recurso es el
// mismo de la lectura pública (extensión prevista en api-spec §3.6).
especialidadesRouter.post("/", requireAuth, grantAccess(["admin"]), validate(especialidadSchema), EspecialidadesController.crear)
especialidadesRouter.put("/:id", requireAuth, grantAccess(["admin"]), validate(especialidadSchema), EspecialidadesController.editar)
especialidadesRouter.patch("/:id/estado", requireAuth, grantAccess(["admin"]), validate(estadoCatalogoSchema), EspecialidadesController.cambiarEstado)
especialidadesRouter.get("/:id/profesionales", requireAuth, grantAccess(["admin"]), EspecialidadesController.getProfesionales)
