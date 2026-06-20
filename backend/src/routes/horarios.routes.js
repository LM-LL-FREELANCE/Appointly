import { Router } from "express";
import { grantAccess, identityStandIn } from "../middlewares/auth.middleware.js";
import { ProfesionalesController } from "../controllers/profesionales.controller.js";

export const horariosRouter = Router()

horariosRouter.put("/:id", identityStandIn, grantAccess(["profesional"]), ProfesionalesController.updateHorario)

horariosRouter.delete("/:id", identityStandIn, grantAccess(["profesional"]), ProfesionalesController.deleteHorario)