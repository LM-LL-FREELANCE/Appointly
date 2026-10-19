import { Router } from "express"
import { TurnosController } from "../controllers/turnos.controller.js"
import { grantAccess } from "../middlewares/auth.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js"

export const turnosRouter = Router();

const TODOS = ["cliente", "profesional", "admin"]
const STAFF = ["profesional", "admin"]

/* turnosRouter.get("/", requireAuth, grantAccess(["profesional"]), TurnosController.getAgenda) */ //working
turnosRouter.get("/", requireAuth, grantAccess(STAFF), TurnosController.getTurnos) //working
turnosRouter.get("/eventos", requireAuth, grantAccess(STAFF), TurnosController.getEventos) // must stay before "/:id"
turnosRouter.get("/:id", requireAuth, grantAccess(TODOS), TurnosController.getTurnoById) //working
turnosRouter.get("/:id/eventos", requireAuth, grantAccess(STAFF), TurnosController.getEventosTurno)
turnosRouter.patch("/:id/estado", requireAuth, grantAccess(TODOS), TurnosController.cambiarEstado)
turnosRouter.post("/:id/reprogramacion", requireAuth, grantAccess(STAFF), TurnosController.reprogramar)
turnosRouter.post("/:id/cancelacion", requireAuth, grantAccess(TODOS), TurnosController.cancelTurnoById) //working
turnosRouter.post("/", requireAuth, grantAccess(TODOS), TurnosController.crearTurno)//working