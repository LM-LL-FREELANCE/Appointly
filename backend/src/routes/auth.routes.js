import { Router } from "express"
import { validate } from "../validators/validate.js"
import { loginSchema, registerSchema } from "../schemas/auth.schema.js"
import { aceptarInvitacionSchema } from "../schemas/invitacion.schema.js"
import { InvitacionesController } from "../controllers/invitaciones.controller.js"
import { AuthController } from "../controllers/auth.controller.js"
import { attachUser } from "../middlewares/auth.middleware.js"
import { authLimiter, sensitiveActionsLimiter } from "../middlewares/rateLimit.middleware.js"

export const authRouter = Router()

authRouter.post("/registro", sensitiveActionsLimiter, validate(registerSchema), AuthController.register)
authRouter.post("/registro/invitacion/:token", sensitiveActionsLimiter, validate(aceptarInvitacionSchema), InvitacionesController.aceptar)
authRouter.post("/login", authLimiter, validate(loginSchema), AuthController.login)
authRouter.post("/logout", AuthController.logout)
authRouter.get("/me", attachUser, AuthController.me)

//reset password endpoint
authRouter.post("/forgot-password", sensitiveActionsLimiter, AuthController.forgotPassword)
authRouter.post("/reset-password", AuthController.resetPassWord)
authRouter.get("/verify-reset-token/:token", AuthController.verifyResetToken)