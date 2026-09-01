import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "node:path"
import { authRouter } from "./routes/auth.routes.js"
import errorHandler from "./middlewares/error.middleware.js"
import { profesionalesRouter } from "./routes/profesionales.routes.js"
import { obraSocialesRouter } from "./routes/obra-sociales.routes.js"
import { especialidadesRouter } from "./routes/especialidades.routes.js"
import { turnosRouter } from "./routes/turnos.routes.js"
import { horariosRouter } from "./routes/horarios.routes.js"
import { clientesRouter } from "./routes/clientes.routes.js"
import { requireApiKey } from "./middlewares/apiKey.middleware.js"
import { globalLimiter } from "./middlewares/rateLimit.middleware.js"
export const app = express()

// deployment middleware, express static
app.use(express.static(path.join(import.meta.dirname, "../../frontend/dist")))

// middlewares for working with other things
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }))
}
app.disable("x-powered-by")
app.use(express.json())
app.use(cookieParser())
app.use("/api", requireApiKey, globalLimiter)


/*CORS middleware */
// In production the frontend is served by this same Express instance
// (single-service deploy), so requests are same-origin and CORS is not
// needed at all. Only mount it in development, where Vite (:5173) and
// the API (:3000) really are different origins.


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

/* Catch-all */
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(import.meta.dirname, "../../frontend/dist/index.html"));
});