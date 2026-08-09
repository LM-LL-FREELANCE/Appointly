import { Router } from "express"
import { StorageController } from "../controllers/storage.controller.js"
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/upload.middleware.js"

export const storageRouter = Router()

storageRouter.post("/avatar/:dni", requireAuth, grantAccess(["profesional", "cliente"]), upload.single("avatar"), StorageController.uploadAvatar)
