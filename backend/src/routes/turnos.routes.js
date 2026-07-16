import { Router } from "express"
import { TurnosController } from "../controllers/turnos.controller.js"
import { grantAccess } from "../middlewares/auth.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js"

export const turnosRouter = Router();

turnosRouter.get("/agenda", requireAuth, grantAccess(["profesional"]), TurnosController.getAgenda) //working
/* turnosRouter.get("/", requireAuth, grantAccess(["profesional"]), TurnosController.getTurnos) */ //working
turnosRouter.get("/:id", requireAuth, grantAccess(["cliente", "profesional"]), TurnosController.getTurnoById) //working
turnosRouter.post("/:id/cancelacion", requireAuth, grantAccess(["cliente", "profesional"]), TurnosController.cancelTurnoById) //working
turnosRouter.post("/", requireAuth, grantAccess(["cliente", "profesional"]), TurnosController.crearTurno)//working