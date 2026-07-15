import { Router } from "express";
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js";
import { ProfesionalesController } from "../controllers/profesionales.controller.js";

export const horariosRouter = Router()

horariosRouter.put("/:id", requireAuth, grantAccess(["profesional"]), ProfesionalesController.updateHorario) //working

horariosRouter.delete("/:id", requireAuth, grantAccess(["profesional"]), ProfesionalesController.deleteHorario) //working