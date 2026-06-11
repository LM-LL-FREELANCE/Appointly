import { readFile } from "node:fs/promises"
import mysql from "mysql2/promise"

const file = process.argv[2]
const sql = await readFile(new URL(`./${file}`, import.meta.url), "utf8")

const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
})

await connection.query(sql)
await connection.end()
console.log(`${file} ejecutado`)