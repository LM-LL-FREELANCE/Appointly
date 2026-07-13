import { Router } from "express"
import { ClientesController } from "../controllers/clientes.controller.js"
import { grantAccess, identityStandIn, requireAuth } from "../middlewares/auth.middleware.js"

export const clientesRouter = Router()

clientesRouter.get("/:dni/turnos", requireAuth, identityStandIn, grantAccess(["cliente"]), ClientesController.getTurnosClienteByDni)
clientesRouter.get("/:dni", requireAuth, identityStandIn, grantAccess(["profesional"]), ClientesController.getClienteByDni)
