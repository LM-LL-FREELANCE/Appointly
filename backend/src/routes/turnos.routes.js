import { Router } from "express"
import { TurnosController } from "../controllers/turnos.controller.js"
import { identityStandIn } from "../middlewares/auth.middleware.js";
import { grantAccess } from "../middlewares/auth.middleware.js";

export const turnosRouter = Router();

turnosRouter.get("/:id", identityStandIn, grantAccess(["cliente", "profesional"]), TurnosController.getTurnoById)
turnosRouter.put("/:id/cancelacion", identityStandIn, grantAccess(["cliente", "profesional"]), TurnosController.cancelTurnoById)
turnosRouter.post("/", TurnosController.crearTurno)