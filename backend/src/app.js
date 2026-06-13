import express from "express"
import cors from "cors"
import errorHandler from "./middlewares/error.middleware.js"
import profesionalesRouter from "./routes/profesionales.routes.js"
import { obraSocialesRouter } from "./routes/obra-sociales.routes.js"
import { especialidadesRouter } from "./routes/especialidades.routes.js"

export const app = express()

app.disable("x-powered-by")
app.use(express.json())
/*CORS middleware */
app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            "http://localhost:5173"
        ]

        if (!origin || ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
    }
}))


/*Routers */
app.use("/api/profesionales", profesionalesRouter)
app.use("/api/obra-sociales", obraSocialesRouter)
app.use("/api/especialidades", especialidadesRouter)



/*Error handler */
app.use(errorHandler)