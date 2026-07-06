import { Router } from "express"
import { ClientesController } from "../controllers/clientes.controller.js"
import { grantAccess, identityStandIn } from "../middlewares/auth.middleware.js"

export const clientesRouter = Router()

clientesRouter.get("/:dni/turnos", identityStandIn, grantAccess(["cliente"]), ClientesController.getTurnosClienteByDni)
clientesRouter.get("/:dni", identityStandIn, grantAccess(["profesional"]), ClientesController.getClienteByDni)
