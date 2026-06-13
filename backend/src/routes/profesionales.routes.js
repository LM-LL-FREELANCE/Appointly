import { Router } from "express";
import { getTurnosByDni } from "../controllers/profesionales.controller.js"

const router = Router()

router.get("/:dni/turnos", getTurnosByDni)

export default router