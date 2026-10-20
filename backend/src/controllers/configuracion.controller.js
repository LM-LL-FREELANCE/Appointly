import { ConfiguracionService } from "../services/configuracion.service.js"

export class ConfiguracionController {
  static async get(req, res, next) {
    try {
      return res.json(await ConfiguracionService.get())
    } catch (err) {
      next(err)
    }
  }

  static async actualizar(req, res, next) {
    try {
      const configuracion = await ConfiguracionService.actualizar(req.body, req.user.dni)
      return res.json(configuracion)
    } catch (err) {
      next(err)
    }
  }
}
