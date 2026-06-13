import { app } from "./app.js"
import { pool } from "./config/db.js"

await pool.query("SELECT 1")

console.log("💾 Vault unlocked. Memories are safely syncing...")

app.listen(process.env.PORT ?? 3000, () => console.log(`⚡ Service is up at http://localhost:${process.env.PORT}/`))