import { Router } from "express"
import { EspecialidadesController } from "../controllers/especialidades.controller.js   "


export const especialidadesRouter = Router()


especialidadesRouter.get("/", EspecialidadesController.getAll)