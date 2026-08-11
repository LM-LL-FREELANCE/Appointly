import { ProfesionalesModel } from "../models/profesionales.model.js";
import { AuthModel } from "../models/auth.model.js";
import { ObraSocialesModel } from "../models/obra-sociales.model.js";
import { HorariosModel } from "../models/horarios.model.js";

const result = await HorariosModel.getHorariosByProfesional({ dni: 27845123 })
console.log(result);
process.exit(0);

//node --env-file=.env backend/src/scripts/try-model.mjs
