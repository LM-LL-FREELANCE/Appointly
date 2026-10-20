import { Router } from "express"
import { AvisosController } from "../controllers/avisos.controller.js"

// Público — avisos activos y vigentes (PLAN_ADMIN.md §8.2 C3).
export const avisosRouter = Router()

avisosRouter.get("/activos", AvisosController.getActivos)
