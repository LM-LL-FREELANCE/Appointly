import { Router } from "express"
import { BloqueosController } from "../controllers/bloqueos.controller.js"

// WS4 — Bloqueos de agenda (PLAN §8.4, B1–B3).
export const adminBloqueosRouter = Router()

adminBloqueosRouter.get("/", BloqueosController.listar)
adminBloqueosRouter.post("/", BloqueosController.crear)
adminBloqueosRouter.delete("/:id", BloqueosController.eliminar)

