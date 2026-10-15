import { Router } from "express"
import { validate } from "../validators/validate.js"
import { resolverSolicitudSchema } from "../schemas/solicitud.schema.js"
import { SolicitudesController } from "../controllers/solicitudes.controller.js"
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js"

export const solicitudesRouter = Router()

// Reviewing account requests is an admin-only task.
solicitudesRouter.use(requireAuth, grantAccess(["admin"]))

solicitudesRouter.get("/", SolicitudesController.list)
solicitudesRouter.patch("/:dni/:role", validate(resolverSolicitudSchema), SolicitudesController.resolver)
