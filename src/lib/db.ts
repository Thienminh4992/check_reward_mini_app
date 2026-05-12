import { Pool, PoolClient, QueryResultRow } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
});
export async function query<T extends QueryResultRow>(
    text: string,
    params?: unknown[],
    client?: PoolClient
): Promise<T[]> {
    const executor = client ?? pool;
    const result = await executor.query<T>(text, params);
    return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
    text: string,
    params?: unknown[],
    client?: PoolClient
): Promise<T | null> {
    const rows = await query<T>(text, params, client);
    return rows[0] ?? null;
}

export async function execute(
    text: string,
    params?: unknown[],
    client?: PoolClient
): Promise<number> {
    const executor = client ?? pool;
    const result = await executor.query(text, params);
    return result.rowCount ?? 0;
}

export async function withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}