import { Router } from "express"
import { AdminMetricasController } from "../controllers/adminMetricas.controller.js"

// WS6 — Exportaciones CSV (PLAN §8.6, D2–D3).
export const adminReportesRouter = Router()

adminReportesRouter.get("/turnos.csv", AdminMetricasController.exportarTurnosCSV)
adminReportesRouter.get("/usuarios.csv", AdminMetricasController.exportarUsuariosCSV)
