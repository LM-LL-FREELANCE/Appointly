import { Router } from "express"
<<<<<<< HEAD
import { AuthController } from "../controllers/auth.controller.js"
export const authRouter = Router()

authRouter.post("/registro", AuthController.register)
=======
import { validate } from "../validators/validate.js"
import { loginSchema } from "../schemas/auth.schema.js"
import { AuthController } from "../controllers/auth.controller.js"
import { requireAuth } from "../middlewares/auth.middleware.js"

export const authRouter = Router()

authRouter.post("/login", validate(loginSchema), AuthController.login)
authRouter.post("/logout", AuthController.logout)
authRouter.get("/me", requireAuth, AuthController.me)
>>>>>>> 05b9af1 (feat: implementing auth with jwt)
