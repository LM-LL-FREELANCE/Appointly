import mysql from "mysql2/promise"

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
})

/**
 * Runs `fn(connection)` inside a transaction. Commits when `fn` resolves and
 * rolls back (rethrowing the original error) when it throws, so multi-statement
 * writes are all-or-nothing. Pass the connection to model methods that must
 * take part in the transaction.
 */
export async function withTransaction(fn) {
    const connection = await pool.getConnection()

    try {
        await connection.beginTransaction()
        const result = await fn(connection)
        await connection.commit()
        return result
    } catch (error) {
        await connection.rollback().catch(() => {})
        throw error
    } finally {
        connection.release()
    }
}
