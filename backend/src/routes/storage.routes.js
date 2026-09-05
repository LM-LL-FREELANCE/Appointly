import { Router } from "express"
import { StorageController } from "../controllers/storage.controller.js"
import { grantAccess, requireAuth } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/upload.middleware.js"

export const storageRouter = Router()

storageRouter.post(
  "/avatar/:dni",
  requireAuth,
  grantAccess(["profesional", "cliente", "admin"]),
  upload.single("avatar"),
  StorageController.uploadAvatar
)

storageRouter.delete(
  "/avatar/:dni",
  requireAuth,
  grantAccess(["profesional", "cliente", "admin"]),
  StorageController.deleteAvatar
)
