import { Router } from "express"
import { validate } from "../validators/validate.js"
import { enviarIndividualSchema, enviarMasivoSchema } from "../schemas/adminComunicaciones.schema.js"
import { AdminComunicacionesController } from "../controllers/adminComunicaciones.controller.js"
import { massMailLimiter } from "../middlewares/rateLimit.middleware.js"

// WS5 — Centro de comunicaciones (PLAN §8.5, M1–M4).
// El guard requireAuth + grantAccess(["admin"]) lo aplica admin.routes.js.
export const adminComunicacionesRouter = Router()

// M1 · historial
adminComunicacionesRouter.get("/", AdminComunicacionesController.historial)

// M2 · preview de segmento
adminComunicacionesRouter.get("/segmentos/:tipo", AdminComunicacionesController.previewSegmento)

// M3 · comunicado individual
adminComunicacionesRouter.post("/individual", validate(enviarIndividualSchema), AdminComunicacionesController.individual)

// M4 · comunicado masivo (3 por hora por IP)
adminComunicacionesRouter.post("/masivo", massMailLimiter, validate(enviarMasivoSchema), AdminComunicacionesController.masivo)
