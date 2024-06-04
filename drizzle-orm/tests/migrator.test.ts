import { describe, test } from 'vitest';
import { drizzle } from "~/node-postgres";
import { migrate } from "~/node-postgres/migrator";
import { Client } from "pg";
import * as schema from './drizzle/schema';
import { resolve } from "node:path";

export const client = new Client({
    connectionString: "postgresql://postgres_larisel:postgres_larisel@localhost:5433/postgres_larisel?schema=public",
});


const db = drizzle(client, { schema });

describe('Drizzle', () => {
	test('Bug', async () => {
		await client.connect();
		const migrationsFolder = resolve(__dirname, "./drizzle");
		await migrate(db, {
            migrationsFolder,
        });
		console.log("done");
	}, {
		timeout: 100000000,
	});
});
