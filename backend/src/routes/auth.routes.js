import { Router } from "express"
import { validate } from "../validators/validate.js"
import { loginSchema, registerSchema } from "../schemas/auth.schema.js"
import { mfaReenviarSchema, mfaVerificarSchema } from "../schemas/mfa.schema.js"
import { aceptarInvitacionSchema } from "../schemas/invitacion.schema.js"
import { InvitacionesController } from "../controllers/invitaciones.controller.js"
import { AuthController } from "../controllers/auth.controller.js"
import { attachUser } from "../middlewares/auth.middleware.js"
import { authLimiter, mfaVerifyLimiter, sensitiveActionsLimiter } from "../middlewares/rateLimit.middleware.js"

export const authRouter = Router()

authRouter.post("/registro", sensitiveActionsLimiter, validate(registerSchema), AuthController.register)
authRouter.post("/registro/invitacion/:token", sensitiveActionsLimiter, validate(aceptarInvitacionSchema), InvitacionesController.aceptar)
authRouter.post("/login", authLimiter, validate(loginSchema), AuthController.login)

// Segundo factor del admin (PLAN §8.1 / §10). El challenge llega del login y
// no vale como sesión; la cookie solo se emite al verificar.
authRouter.post("/mfa/verificar", mfaVerifyLimiter, validate(mfaVerificarSchema), AuthController.verificarMfa)
authRouter.post("/mfa/reenviar", validate(mfaReenviarSchema), AuthController.reenviarMfa)

authRouter.post("/logout", AuthController.logout)
authRouter.get("/me", attachUser, AuthController.me)

//reset password endpoint
authRouter.post("/forgot-password", sensitiveActionsLimiter, AuthController.forgotPassword)
authRouter.post("/reset-password", AuthController.resetPassWord)
authRouter.get("/verify-reset-token/:token", AuthController.verifyResetToken)