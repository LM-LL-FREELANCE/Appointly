import { Router } from "express"
import { validate } from "../validators/validate.js"
import { configuracionSchema } from "../schemas/configuracion.schema.js"
import { ConfiguracionController } from "../controllers/configuracion.controller.js"

// WS3 — Configuración general del centro (PLAN_ADMIN.md §8.2, C2).
// El router ya está protegido por admin.routes.js (requireAuth + grantAccess).
export const adminConfiguracionRouter = Router()

adminConfiguracionRouter.put("/", validate(configuracionSchema), ConfiguracionController.actualizar)
