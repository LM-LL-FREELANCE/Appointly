import { ProfesionalesModel } from "../models/profesionales.model.js";
import { AuthModel } from "../models/auth.model.js";
import { ObraSocialesModel } from "../models/obra-sociales.model.js";
import { HorariosModel } from "../models/horarios.model.js";
import { TurnosModel } from "../models/turnos.model.js";
import { EspecialidadesModel } from "../models/especialidades.model.js";

const result = await TurnosModel.getTurnoById(1)
console.log(result);
process.exit(0);

//node --env-file=.env backend/src/scripts/try-model.mjs

//import { TurnosModel } from "../models/turnos.model.js";
//import { ProfesionalesModel } from "../models/profesionales.model.js";
//import { ClientesModel } from "../models/clientes.model.js";
//const result = await TurnosModel.getTurnoByDni(22456789)
//const result = await TurnosModel.getTurnoById(1); works
//const result = await TurnosModel.getTurnosByProfesional({ dni: 27845123, desde: '2026-06-15', hasta: '2026-06-22', estado: "activo" }) works
//const result = await ProfesionalesModel.filterBy({ especialidad: 1, obraSocial: 3 }) works
//const result = await ProfesionalesModel.getByDni({ dni: 27845123 })  works
//const result = await ProfesionalesModel.updateByDni({ dni: 27845123, especialidades: ["Kinesiologia"], obras_sociales: ["OSDE", "Swiss Medical", "Galeno"] })works
//const result = await ClientesModel.getTurnosClienteByDni({ dni: 23789012, estado: "activo" }) works
//const result = await ClientesModel.getClienteByDni({ dni: 23789012 }) works
//const result = await ClientesModel.getActivos({ dni: 23789012 }) works
//const result = await ClientesModel.patchClienteData({ dni: 23789012, nombre: "luca", apellido: "latigano", correo: "lucalatigano12@gmail.com" }) works
// console.log(result);
//process.exit(0);  
