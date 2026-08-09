import crypto from "crypto";
import { s3 } from "../config/r2.js"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { AppError } from "../utils/AppError.js"

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

  static async uploadAvatar(inputBuffer, id) {
    const outputBuffer = await this.#processImage(inputBuffer)
    const KEY_NAME = this.#generateKeyName(id)

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: KEY_NAME,
          Body: outputBuffer,
          ContentType: "image/webp",
        })
      )
    } catch (err) {
      throw new AppError('Error uploading avatar')
    }

    const imageUrl = `${process.env.R2_BUCKET_URL}/${KEY_NAME}`

    return await StorageModel.uploadAvatar(id, role, imageUrl)
  }
}
