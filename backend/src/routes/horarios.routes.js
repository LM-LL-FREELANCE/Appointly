import { Router } from "express";
import { grantAccess, identityStandIn } from "../middlewares/auth.middleware.js";
import { ProfesionalesController } from "../controllers/profesionales.controller.js";

const router = Router()

router.put("/:id", identityStandIn, grantAccess(["profesional"]), ProfesionalesController.updateHorario)

router.delete("/:id", identityStandIn, grantAccess(["profesional"]), ProfesionalesController.deleteHorario)

export default router