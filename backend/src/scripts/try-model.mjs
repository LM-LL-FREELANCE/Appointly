//import { ProfesionalesModel } from "../models/profesionales.model.js";
//import { AuthModel } from "../models/auth.model.js";
//import { ObraSocialesModel } from "../models/obra-sociales.model.js";
//import { HorariosModel } from "../models/horarios.model.js";

import { AuthModel } from "../models/auth.model.js";



const result = await AuthModel.findCredentialsByDniAndRole(20232779, "profesional")
/*const result = await AuthModel.createClienteAccount({
  data: {
    dni: 20232778,
    nombre: "Andrea",
    apellido: "Arroyo",
    correo: "aduc@gmai.com",
    password_hash: "andrearroyo123145",
    telefono: 3875661423,
    fecha_nacimiento: "1968-08-07",
    genero: "M",
    id_obra_social: 1,
    numero_afiliado: 123456789
  }
})works*/
/*const result = await AuthModel.createProfesionalAccount({
  data: {
    dni: 20232779,
    nombre: "Jorge",
    apellido: "Arroyo",
    correo: "jorge@gmail.com",
    password_hash: "jorgearroyo567890123",
    telefono: 3875661443,
    fecha_nacimiento: "1968-08-07",
    genero: "M",
    numero_matricula: 123154151
  }
})works*/
console.log(result);
process.exit(0);






//node --env-file=.env backend/src/scripts/try-model.mjs
//const result = await HorariosModel.getHorariosByProfesional({ dni: 27845123 })
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
