import { EspecialidadesModel } from "../models/especialidades.model.js";
import { AppError } from "../utils/AppError.js";

export class EspecialidadesController {
    static async getAll(req, res, next) {
        try {
            const data = await EspecialidadesModel.getAll()

            if (!data) {
                throw new AppError("We couldn't find any specialities", 404, "NOT_FOUND");
            }

            return res.json(data)
        } catch (err) {
            next(err);
        }
    }
}