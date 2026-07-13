import { Router } from "express";
import { grantAccess, identityStandIn, requireAuth } from "../middlewares/auth.middleware.js";
import { ProfesionalesController } from "../controllers/profesionales.controller.js";

export const horariosRouter = Router()

horariosRouter.put("/:id", requireAuth, identityStandIn, grantAccess(["profesional"]), ProfesionalesController.updateHorario)

horariosRouter.delete("/:id", requireAuth, identityStandIn, grantAccess(["profesional"]), ProfesionalesController.deleteHorario)