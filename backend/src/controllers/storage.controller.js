import { StorageService } from "../services/storage.service.js"

export class StorageController {
  static async uploadAvatar(req, res, next) {
    const { id } = req.params
    const { buffer } = req.file

    try {
      const avatarURL = await StorageService.uploadAvatar(buffer, id)
    } catch (err) {
      next(err)
    }

    return res.status(201).json({ avatarURL })
  }
}
