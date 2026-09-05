import { StorageService } from "../services/storage.service.js"
import { AppError } from "../utils/AppError.js"

export class StorageController {
  static async uploadAvatar(req, res, next) {
    const { dni } = req.params

    if (!dni) {
      return next(new AppError("El DNI es requerido.", 400, "BAD_REQUEST"))
    }

    if (req.user?.dni !== dni && req.user?.role !== "admin") {
      return next(new AppError("No tenés permisos para realizar esta acción.", 403, "FORBIDDEN"))
    }

    if (!req.file?.buffer) {
      return next(new AppError("El archivo de imagen es requerido.", 400, "BAD_REQUEST"))
    }

    try {
      const avatarURL = await StorageService.uploadAvatar(dni, req.file.buffer)
      return res.status(201).json({ avatarURL })
    } catch (err) {
      next(err)
    }
  }

  static async deleteAvatar(req, res, next) {
    const { dni } = req.params

    if (!dni) {
      return next(new AppError("El DNI es requerido.", 400, "BAD_REQUEST"))
    }

    if (req.user?.dni !== dni && req.user?.role !== "admin") {
      return next(new AppError("No tenés permisos para realizar esta acción.", 403, "FORBIDDEN"))
    }

    try {
      const result = await StorageService.deleteAvatar(dni)
      return res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }
}
