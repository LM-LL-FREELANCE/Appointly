import { Router } from "express"
import { validate } from "../validators/validate.js"
import { estadoCatalogoSchema, obraSocialSchema } from "../schemas/catalogos.schema.js"
import { obraSocialesController } from "../controllers/obra-sociales.controller.js"
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js"

export const obraSocialesRouter = Router()

// Lectura pública (PLAN §8.7 E6): espejo de E1 para obras sociales.
obraSocialesRouter.get('/', obraSocialesController.getAll)

// ABM admin (PLAN §8.7 E7–E10), espejo de E2–E5 sobre el recurso existente.
obraSocialesRouter.post('/', requireAuth, grantAccess(["admin"]), validate(obraSocialSchema), obraSocialesController.crear)
obraSocialesRouter.put('/:id', requireAuth, grantAccess(["admin"]), validate(obraSocialSchema), obraSocialesController.editar)
obraSocialesRouter.patch('/:id/estado', requireAuth, grantAccess(["admin"]), validate(estadoCatalogoSchema), obraSocialesController.cambiarEstado)
obraSocialesRouter.get('/:id/profesionales', requireAuth, grantAccess(["admin"]), obraSocialesController.getProfesionales)
