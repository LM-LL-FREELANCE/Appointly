import fs from "node:fs/promises";
import { StorageService } from "./src/services/storage.service.js";

const DNI = "27845123"; // DNI de la persona en la base de datos
const imageBuffer = await fs.readFile("./friendly-guy.jpg");

try {
  //const result = await StorageService.uploadAvatar(DNI, imageBuffer)
  const result = await StorageService.deleteAvatar(DNI)
  console.log("Avatar subido con éxito:", result);
} catch (error) {
  console.error("Error al subir avatar:", error);
}
