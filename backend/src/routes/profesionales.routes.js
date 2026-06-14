import { Router } from "express";
import { getTurnosByDni, ProfesionalesController } from "../controllers/profesionales.controller.js"

const profesionalesRouter = Router()

profesionalesRouter.get("/:dni/turnos", getTurnosByDni)
profesionalesRouter.get("/", ProfesionalesController.filterBy)
profesionalesRouter.get(":dni", ProfesionalesController.getByDni)
export default profesionalesRouter