import { Router } from "express";
import { ProfesionalesController } from "../controllers/profesionales.controller.js"
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js";
import { horarioValidator } from "../validators/horario.validator.js";
import { TurnosController } from "../controllers/turnos.controller.js"

export const profesionalesRouter = Router()

profesionalesRouter.get("/:dni/horarios", requireAuth, grantAccess(["profesional"]), ProfesionalesController.getHorariosByDni) //working
profesionalesRouter.post("/:dni/horarios", requireAuth, grantAccess(["profesional"]), horarioValidator, ProfesionalesController.createHorario) //working
profesionalesRouter.patch("/:dni/actualizar", requireAuth, grantAccess(["profesional"]), ProfesionalesController.updateByDni) //working


profesionalesRouter.get("/", ProfesionalesController.filterBy)
profesionalesRouter.get("/:dni", ProfesionalesController.getByDni)
profesionalesRouter.get("/:dni/slots", TurnosController.getSlots)
profesionalesRouter.delete("/:dni", requireAuth, grantAccess(["profesional", "admin"]), ProfesionalesController.deleteAcc)