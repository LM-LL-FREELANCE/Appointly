export class AppError extends Error {
  constructor(message, statusCode = 500, code = null, fieldErrors = []) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.fieldErrors = fieldErrors
  }
}