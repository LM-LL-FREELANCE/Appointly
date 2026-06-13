import { obraSocialesModel } from "../models/obra-sociales.model.js"

export class obraSocialesController {
    static async getAll(req, res) {
        const data = await obraSocialesModel.getAll()
        if (!data) {
            res.status(404).json({ message: "you have made a bad request" })
        }
        return res.json(data)
    }
}