import { ObraSocialesModel } from "../models/obra-sociales.model.js";
import { AppError } from "../utils/AppError.js";

export class obraSocialesController {
  static async getAll(req, res, next) {
    try {
      const data = await ObraSocialesModel.getAll()
      if (!data) {
        throw new AppError("you have made a bad request", 404, "NOT_FOUND");
      }
      return res.json(data)
    } catch (err) {
      next(err);
    }
  }
}