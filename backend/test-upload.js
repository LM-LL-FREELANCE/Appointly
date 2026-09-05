import fs from "node:fs/promises"
import { StorageService } from "./src/services/storage.service.js"

const DNI = "27845123"
const imageBuffer = await fs.readFile("./friendly-guy.jpg")

try {
  const result = await StorageService.uploadAvatar(DNI, imageBuffer)
  console.log("Avatar subido con éxito:", result)
} catch (error) {
  console.error("Error al subir avatar:", error)
}
