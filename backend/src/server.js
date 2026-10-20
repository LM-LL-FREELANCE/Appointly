import { createServer } from "node:http"
import { app } from "./app.js"
import { pool } from "./config/db.js"
import { initSocket } from "./socket/index.js"

await pool.query("SELECT 1")

console.log("💾 Vault unlocked. Memories are safely syncing...")

// Socket.IO comparte el mismo puerto que la API (PLAN §9): mismo origin en
// produccion; en dev el proxy de Vite reenvia `/socket.io` a este server.
const server = createServer(app)
initSocket(server)

server.listen(process.env.PORT ?? 3000, () => console.log(`⚡ Service is up at http://localhost:${process.env.PORT}/`))
