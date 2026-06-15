import { EspecialidadesModel } from "../models/especialidades.model.js";

export class EspecialidadesController {
    static async getAll(req, res) {
        const data = await EspecialidadesModel.getAll()

        if (!data) {
            return res.status(404).json({ message: "We couldn't find any specialities" })
        }

        return res.json(data)
    }
}