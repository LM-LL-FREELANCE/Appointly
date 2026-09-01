import { Router } from "express"
import { validate } from "../validators/validate.js"
import { loginSchema, registerProfesionalSchema } from "../schemas/auth.schema.js"
import { AuthController } from "../controllers/auth.controller.js"
import { attachUser } from "../middlewares/auth.middleware.js"
import { authLimiter, sensitiveActionsLimiter } from "../middlewares/rateLimit.middleware.js"

export const authRouter = Router()

authRouter.post("/registro", sensitiveActionsLimiter, AuthController.register)
authRouter.post("/registro-profesional", sensitiveActionsLimiter, validate(registerProfesionalSchema), AuthController.registerProfesional)
authRouter.post("/login", authLimiter, validate(loginSchema), AuthController.login)
authRouter.post("/logout", AuthController.logout)
authRouter.get("/me", attachUser, AuthController.me)

//reset password endpoint
authRouter.post("/forgot-password", sensitiveActionsLimiter, AuthController.forgotPassword)
authRouter.post("/reset-password", AuthController.resetPassWord)
authRouter.get("/verify-reset-token/:token", AuthController.verifyResetToken)