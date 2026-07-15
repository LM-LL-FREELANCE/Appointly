import { Router } from "express"
import { validate } from "../validators/validate.js"
import { loginSchema } from "../schemas/auth.schema.js"
import { AuthController } from "../controllers/auth.controller.js"
import { attachUser } from "../middlewares/auth.middleware.js"

export const authRouter = Router()

authRouter.post("/registro", AuthController.register)
authRouter.post("/login", validate(loginSchema), AuthController.login)
authRouter.post("/logout", AuthController.logout)
authRouter.get("/me", attachUser, AuthController.me)

