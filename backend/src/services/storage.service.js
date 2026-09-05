import crypto from "node:crypto"
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { s3 } from "../config/r2.js"
import { StorageModel } from "../models/storage.model.js"
import { AppError } from "../utils/AppError.js"

export class StorageService {
  static async #processImage(inputBuffer) {
    try {
      return await sharp(inputBuffer)
        .rotate()
        .resize(512, 512, { fit: "cover", position: "attention" })
        .webp({ quality: 80 })
        .toBuffer()
    } catch {
      throw new AppError("Error al procesar la imagen.", 400, "IMAGE_PROCESSING_ERROR")
    }
  }

  static #generateKeyName(id) {
    return `persona-avatars/${id}-${crypto.randomUUID()}.webp`
  }

  static #extractKeyFromUrl(url) {
    if (!url) return null
    try {
      const parsed = new URL(url)
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))
    } catch {
      return url.replace(/^\/+/, "")
    }
  }

  static async #deleteR2Object(key) {
    if (!key) return
    const input = {
      Bucket: process.env.R2_BUCKET_NAME || "appointly-test",
      Key: key,
    }
    const command = new DeleteObjectCommand(input)
    await s3.send(command)
  }

  static async uploadAvatar(id, inputBuffer) {
    const persona = await StorageModel.getPersona(id)
    if (!persona) {
      throw new AppError("Persona no encontrada.", 404, "NOT_FOUND")
    }

    if (persona.foto_url) {
      const oldKey = this.#extractKeyFromUrl(persona.foto_url)
      try {
        await this.#deleteR2Object(oldKey)
      } catch {
        throw new AppError("Error al eliminar el avatar anterior en R2.", 500, "STORAGE_ERROR")
      }
    }

    const outputBuffer = await this.#processImage(inputBuffer)
    const keyName = this.#generateKeyName(id)
    const bucketName = process.env.R2_BUCKET_NAME || "appointly-test"

    const input = {
      Bucket: bucketName,
      Key: keyName,
      Body: outputBuffer,
      ContentType: "image/webp",
    }

    try {
      const command = new PutObjectCommand(input)
      await s3.send(command)
    } catch {
      throw new AppError("Error al subir el avatar a R2.", 500, "STORAGE_ERROR")
    }

    const bucketUrl = process.env.R2_BUCKET_URL || ""
    const imageUrl = bucketUrl ? `${bucketUrl}/${keyName}` : keyName

    const updated = await StorageModel.updateAvatar(id, imageUrl)
    if (!updated) {
      await this.#deleteR2Object(keyName).catch(() => null)
      throw new AppError("Error al persistir el avatar en la base de datos.", 500, "DATABASE_ERROR")
    }

    return imageUrl
  }

  static async deleteAvatar(id) {
    const persona = await StorageModel.getPersona(id)
    if (!persona) {
      throw new AppError("Persona no encontrada.", 404, "NOT_FOUND")
    }

    if (!persona.foto_url) {
      return { success: true, message: "No posee avatar activo" }
    }

    const key = this.#extractKeyFromUrl(persona.foto_url)
    try {
      await this.#deleteR2Object(key)
    } catch {
      throw new AppError("Error al eliminar el avatar en R2.", 500, "STORAGE_ERROR")
    }

    const cleared = await StorageModel.clearAvatar(id)
    if (!cleared) {
      throw new AppError("Error al actualizar la base de datos.", 500, "DATABASE_ERROR")
    }

    return { success: true, message: "Avatar eliminado correctamente" }
  }
}
