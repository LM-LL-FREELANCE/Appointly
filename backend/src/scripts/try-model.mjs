import { ProfesionalesModel } from "../models/profesionales.model.js";
import { AuthModel } from "../models/auth.model.js";


/*const persona = {
  dni_persona: 44111222,
  nombre: "Nahuel",
  apellido: "Molina",
  correo: "nmolina@appointly.dev",
  password_hash: "$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG",
  telefono: "3874123456",
  fecha_nacimiento: "1971-02-14",
  genero: "M",
  es_admin: true
}*/

const result = await AuthModel.createAccount(persona, "profesional")
console.log(result);
process.exit(0);

//node --env-file=.env backend/src/scripts/try-model.mjs
