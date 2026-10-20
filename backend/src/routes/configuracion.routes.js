import { Router } from "express"
import { ConfiguracionController } from "../controllers/configuracion.controller.js"

// Público — lectura de la configuración del centro (PLAN_ADMIN.md §8.2 C1).
export const configuracionRouter = Router()

configuracionRouter.get("/", ConfiguracionController.get)
