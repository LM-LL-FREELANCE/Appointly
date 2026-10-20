import { ConfiguracionModel } from "../models/configuracion.model.js"

export class ConfiguracionService {
  static get() {
    return ConfiguracionModel.get()
  }

  static actualizar(data, dniAdmin) {
    return ConfiguracionModel.upsert(data, dniAdmin)
  }
}
