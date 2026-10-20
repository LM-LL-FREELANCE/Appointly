import { Router } from "express"
import { AdminMetricasController } from "../controllers/adminMetricas.controller.js"

// WS6 — Metricas del panel (PLAN §8.6, D1).
export const adminMetricasRouter = Router()

adminMetricasRouter.get("/", AdminMetricasController.obtenerMetricas)
