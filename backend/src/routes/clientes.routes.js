import { Router } from "express"
import { ClientesController } from "../controllers/clientes.controller.js"
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js"

export const clientesRouter = Router()

clientesRouter.get("/:dni/turnos", requireAuth, grantAccess(["cliente"]), ClientesController.getTurnosClienteByDni) //working
clientesRouter.get("/:dni", requireAuth, grantAccess(["profesional"]), ClientesController.getClienteByDni) //working
clientesRouter.get("/:dni/turnos/mes", requireAuth, grantAccess(["cliente"]), ClientesController.getTurnosMes)