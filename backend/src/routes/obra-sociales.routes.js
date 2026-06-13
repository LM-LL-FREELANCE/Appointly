import { Router } from "express"
import { obraSocialesController } from "../controllers/obra-sociales.controller.js"

export const obraSocialesRouter = Router()


obraSocialesRouter.get('/', obraSocialesController.getAll)