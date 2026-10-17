import { Router } from "express"
import { validate } from "../validators/validate.js"
import { crearInvitacionSchema } from "../schemas/invitacion.schema.js"
import { InvitacionesController } from "../controllers/invitaciones.controller.js"
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js"

export const invitacionesRouter = Router()

// Public: the token itself is the credential (256 random bits, not guessable).
// Only the global /api limiter applies here: the strict registration limiter is
// reserved for the POST that consumes the token (see auth.routes.js), otherwise
// merely opening or refreshing the link would burn the user's attempts.
invitacionesRouter.get("/validar/:token", InvitacionesController.validar)

// Admin only.
invitacionesRouter.get("/", requireAuth, grantAccess(["admin"]), InvitacionesController.list)
invitacionesRouter.post("/", requireAuth, grantAccess(["admin"]), validate(crearInvitacionSchema), InvitacionesController.crear)
invitacionesRouter.delete("/:id", requireAuth, grantAccess(["admin"]), InvitacionesController.revocar)
