import { ObraSocialesService } from "../services/obra-sociales.service.js";
import { idCatalogoSchema } from "../schemas/catalogos.schema.js";
import { AppError } from "../utils/AppError.js";

const parseId = (value) => {
  const id = idCatalogoSchema.safeParse(value)
  if (!id.success) throw new AppError("Id de obra social inválido.", 400, "BAD_REQUEST")
  return id.data
}

export class obraSocialesController {
  static async getAll(req, res, next) {
    try {
      return res.json(await ObraSocialesService.getAll())
    } catch (err) {
      next(err);
    }
  }

  static async crear(req, res, next) {
    try {
      const obraSocial = await ObraSocialesService.crear(req.body)
      return res.status(201).json(obraSocial)
    } catch (err) {
      next(err);
    }
  }

  static async editar(req, res, next) {
    try {
      const obraSocial = await ObraSocialesService.editar(parseId(req.params.id), req.body)
      return res.json(obraSocial)
    } catch (err) {
      next(err);
    }
  }

  static async cambiarEstado(req, res, next) {
    try {
      const obraSocial = await ObraSocialesService.cambiarEstado(parseId(req.params.id), req.body.activo)
      return res.json(obraSocial)
    } catch (err) {
      next(err);
    }
  }

  static async getProfesionales(req, res, next) {
    try {
      const profesionales = await ObraSocialesService.getProfesionales(parseId(req.params.id))
      return res.json(profesionales)
    } catch (err) {
      next(err);
    }
  }
}
