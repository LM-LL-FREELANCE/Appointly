//import { TurnosModel } from "../models/turnos.model.js";
import { ProfesionalesModel } from "../models/profesionales.model.js";
//const result = await TurnosModel.getTurnoByDni(22456789)
//const result = await TurnosModel.getTurnoById(1); works
//const result = await TurnosModel.getTurnosByProfesional({ dni: 27845123, desde: '2026-06-15', hasta: '2026-06-22', estado: "activo" }) works
//const result = await ProfesionalesModel.filterBy({ especialidad: 1, obraSocial: 3 }) works
//const result = await ProfesionalesModel.getByDni({ dni: 27845123 })  works
const result = await ProfesionalesModel.updateByDni({ dni: 27845123, especialidades: ["Kinesiologia"], obras_sociales: ["OSDE", "Swiss Medical", "Galeno"] })
console.log(result);
process.exit(0);  