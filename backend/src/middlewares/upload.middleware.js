import multer from 'multer'
import { AppError } from "../utils/AppError.js"

export const upload = multer({
  limits: {
    fields: 10,
    fileSize: 1024 * 1024 * 2,
    files: 1,
    fieldNestingDepth: 3
  },
  fileFilter: (req, file, cb) => {
    const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!acceptedMimeTypes.includes(file.mimetype)) {
      return cb(new AppError('Format not accepted', 400, 'BAD_REQUEST'))
    }

    cb(null, true)
  },
  storage: multer.memoryStorage()
})

