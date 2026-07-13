import { Router } from "express";
import { ProfesionalesController } from "../controllers/profesionales.controller.js"
import { grantAccess, identityStandIn, requireAuth } from "../middlewares/auth.middleware.js";
import { horarioValidator } from "../validators/horario.validator.js";
import { TurnosController } from "../controllers/turnos.controller.js"

export const profesionalesRouter = Router()
//lean
profesionalesRouter.get("/:dni/turnos", requireAuth, ProfesionalesController.getHorariosByDni)
profesionalesRouter.get("/:dni/horarios", requireAuth, identityStandIn, grantAccess(["cliente", "profesional"]), ProfesionalesController.getHorariosByDni)
profesionalesRouter.post("/:dni/horarios", requireAuth, identityStandIn, grantAccess(["profesional"]), horarioValidator, ProfesionalesController.createHorario)

//luca
profesionalesRouter.get("/", ProfesionalesController.filterBy)
profesionalesRouter.get("/:dni", ProfesionalesController.getByDni)

profesionalesRouter.patch("/:dni", requireAuth, identityStandIn, grantAccess(["profesional"]), ProfesionalesController.updateByDni)

profesionalesRouter.get("/:dni/slots", TurnosController.getSlots)