import express from "express"
import cors from "cors"
export const app = express()


app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            "http://localhost:5173"
        ]

        if (origin.includes(ACCEPTED_ORIGINS)) {
            return callback(null, true)
        }
        if (!origin) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
    }
}))
app.disable("x-powered-by")
app.use(express.json())