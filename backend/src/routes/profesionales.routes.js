import { Router } from "express";
import { ProfesionalesController } from "../controllers/profesionales.controller.js"
import { grantAccess, identityStandIn } from "../middlewares/auth.middleware.js";
import { horarioValidator } from "../validators/horario.validator.js";

const router = Router()

router.get("/:dni/horarios", identityStandIn, grantAccess(["cliente", "profesional"]), ProfesionalesController.getHorariosByDni)

router.post("/:dni/horarios", identityStandIn, grantAccess(["profesional"]), horarioValidator, ProfesionalesController.createHorario)

export default router