import crypto from "crypto";
import { s3 } from "../config/r2.js"
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { AppError } from "../utils/AppError.js"
import { StorageModel } from "../models/storage.model.js"

export class StorageService {

  static async #processImage(inputBuffer) {
    try {
      return await sharp(inputBuffer)
        .rotate()
        .resize(512, 512, { fit: 'cover', position: 'attention' })
        .webp({ quality: 80 })
        .toBuffer()

    } catch (err) {
      throw new AppError('Error processing image')
    }
  }

  static #generateKeyName(id) {
    return id + '-' + crypto.randomUUIDv7()
  }

  static async deleteAvatar(id) {
    const foto_url = await StorageModel.getPhotoURL(id)

    if (!foto_url) console.log("Foto no encontrada")

    const url = new URL(foto_url)
    const KEY_NAME = url.pathname.slice(1)

    const input = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: KEY_NAME,
    }

    try {
      const command = new DeleteObjectCommand(input)
      const response = await s3.send(command)

      console.log(response)

    } catch (err) {
      throw new AppError('Error deleting avatar')
    }
  }

  static async uploadAvatar(id, inputBuffer) {
    const outputBuffer = await this.#processImage(inputBuffer)
    const KEY_NAME = this.#generateKeyName(id)

    const input = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: KEY_NAME,
      Body: outputBuffer,
      ContentType: "image/webp",
    }

    try {
      const command = new PutObjectCommand(input)
      const response = await s3.send(command)

      const imageUrl = `${process.env.R2_BUCKET_URL}/${KEY_NAME}`

      console.log(response)

      return StorageModel.uploadAvatar(id, imageUrl)

    } catch (err) {
      throw new AppError('Error uploading avatar')
    }

  }
}
