import * as profesionalesService from "../services/profesionales.service.js"

export const getTurnosByDni = async (req, res, next) => {
  try {
    const turnos = await profesionalesService.obtenerTurnosPorDni(Number(req.params.dni))
    res.status(200).json(turnos)
  } catch (err) {
    next(err)
  }
}


export class ProfesionalesController {

}