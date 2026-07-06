import { Router } from "express"
import { TurnosController } from "../controllers/turnos.controller.js"
import { identityStandIn } from "../middlewares/auth.middleware.js";
import { grantAccess } from "../middlewares/auth.middleware.js";

export const turnosRouter = Router();

turnosRouter.get("/", identityStandIn, grantAccess(["profesional"]), TurnosController.getAgenda)

turnosRouter.get("/:id", identityStandIn, grantAccess(["cliente", "profesional"]), TurnosController.getTurnoById)
turnosRouter.post("/:id/cancelacion", identityStandIn, grantAccess(["cliente", "profesional"]), TurnosController.cancelTurnoById)
turnosRouter.post("/", identityStandIn, grantAccess(["cliente", "profesional"]), TurnosController.crearTurno)