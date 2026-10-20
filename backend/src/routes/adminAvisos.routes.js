import { Router } from "express"
import { validate } from "../validators/validate.js"
import { avisoSchema } from "../schemas/avisos.schema.js"
import { AvisosController } from "../controllers/avisos.controller.js"

// WS3 — gestión de avisos (PLAN_ADMIN.md §8.2, C4–C7).
// El router ya está protegido por admin.routes.js (requireAuth + grantAccess).
export const adminAvisosRouter = Router()

adminAvisosRouter.get("/", AvisosController.getAll)
adminAvisosRouter.post("/", validate(avisoSchema), AvisosController.crear)
adminAvisosRouter.put("/:id", validate(avisoSchema), AvisosController.editar)
adminAvisosRouter.delete("/:id", AvisosController.eliminar)
