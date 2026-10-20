import { Router } from "express"
import { TurnosController } from "../controllers/turnos.controller.js"

// WS4 — Monitor global de turnos y acciones admin (PLAN §8.4, T1–T5).
export const adminTurnosRouter = Router()

adminTurnosRouter.get("/", TurnosController.getTurnosAdmin)
adminTurnosRouter.post("/:id/cancelacion", TurnosController.cancelTurnoById)
adminTurnosRouter.post("/:id/reasignacion", TurnosController.reasignar)
adminTurnosRouter.post("/:id/completacion", TurnosController.completarPorAdmin)
adminTurnosRouter.post("/:id/ausencia", TurnosController.marcarAusentePorAdmin)

