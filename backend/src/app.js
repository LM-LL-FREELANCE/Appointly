import express from "express"
import { errorHandler } from "./middleware/errorHandler"

export const app = express()

app.disable("x-powered-by")
app.use(express.json())

app.use(errorHandler)