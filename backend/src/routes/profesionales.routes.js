import { Router } from "express";
import { getTurnosByDni, ProfesionalesController } from "../controllers/profesionales.controller.js"
import { grantAccess, identityStandIn } from "../middlewares/auth.middleware.js";
import { horarioValidator } from "../validators/horario.validator.js";


export const profesionalesRouter = Router()

profesionalesRouter.get("/:dni/turnos", getTurnosByDni)
profesionalesRouter.get("/", ProfesionalesController.filterBy)
profesionalesRouter.get("/:dni", ProfesionalesController.getByDni)
profesionalesRouter.get("/:dni/horarios", identityStandIn, grantAccess(["cliente", "profesional"]), ProfesionalesController.getHorariosByDni)
profesionalesRouter.post("/:dni/horarios", identityStandIn, grantAccess(["profesional"]), horarioValidator, ProfesionalesController.createHorario)

