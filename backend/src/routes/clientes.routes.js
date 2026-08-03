import { Router } from "express"
import { ClientesController } from "../controllers/clientes.controller.js"
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js"

export const clientesRouter = Router()

clientesRouter.get("/:dni/turnos", requireAuth, grantAccess(["cliente"]), ClientesController.getTurnosClienteByDni) //working
clientesRouter.get("/:dni", requireAuth, grantAccess(["cliente", "profesional"]), ClientesController.getClienteByDni) //working
clientesRouter.get("/:dni/mes", requireAuth, grantAccess(["cliente"]), ClientesController.getTurnosMes) //working
clientesRouter.get("/:dni/turnos/activos", requireAuth, grantAccess(["cliente"]), ClientesController.getActivos) //working
clientesRouter.patch("/:dni/actualizar", requireAuth, grantAccess(["cliente"]), ClientesController.patchClienteData) //working
clientesRouter.delete("/:dni/delete", requireAuth, grantAccess(["cliente"]), ClientesController.deleteAccount)