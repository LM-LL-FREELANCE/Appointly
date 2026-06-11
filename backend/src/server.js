import { app } from "./app.js"
import { pool } from "./config/db.js"

await pool.query("SELECT 1")
console.log("DB conectada")

app.listen(process.env.PORT ?? 3000, () => console.log("Server corriendo"))