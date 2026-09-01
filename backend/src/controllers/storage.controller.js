import { StorageService } from "../services/storage.service.js"

export class StorageController {
  static async uploadAvatar(req, res, next) {
    const { dni } = req.params
    const { buffer } = req.file

    try {
      const avatarURL = await StorageService.uploadAvatar(dni, buffer)
      return res.status(201).json({ avatarURL })

    } catch (err) {
      next(err)
    }
  }
}
