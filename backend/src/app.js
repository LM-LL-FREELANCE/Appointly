import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { authRouter } from "./routes/auth.routes.js"
import errorHandler from "./middlewares/error.middleware.js"
import { profesionalesRouter } from "./routes/profesionales.routes.js"
import { obraSocialesRouter } from "./routes/obra-sociales.routes.js"
import { especialidadesRouter } from "./routes/especialidades.routes.js"
import { turnosRouter } from "./routes/turnos.routes.js"
import { horariosRouter } from "./routes/horarios.routes.js"
import { clientesRouter } from "./routes/clientes.routes.js"

export const app = express()

app.disable("x-powered-by")
app.use(express.json())
app.use(cookieParser())


/*CORS middleware */
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      "http://localhost:5173"
    ]

    if (process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }

    if (!origin || ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))


/*Routers */
app.use("/api/auth", authRouter)
app.use("/api/profesionales", profesionalesRouter)
app.use("/api/obra-sociales", obraSocialesRouter)
app.use("/api/especialidades", especialidadesRouter)
app.use("/api/horarios", horariosRouter)
app.use("/api/turnos", turnosRouter)
app.use("/api/clientes", clientesRouter)

/*Error handler */
app.use(errorHandler)