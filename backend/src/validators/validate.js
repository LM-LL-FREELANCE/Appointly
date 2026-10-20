import { AppError } from "../utils/AppError.js"
import { z } from "zod"

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)

  if (!result.success) {
    const { formErrors, fieldErrors } = z.flattenError(result.error)
    throw new AppError(formErrors[0] ?? "Datos de entrada inválidos.", 400, "BAD_REQUEST", fieldErrors)
  }

  req.body = result.data

  next()
}