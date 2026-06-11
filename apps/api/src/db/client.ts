import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { databaseUrlFromEnv } from './database-url';
import * as schema from './schema';

export type AppDatabase = NodePgDatabase<typeof schema>;

export interface DatabaseConnection {
  readonly db: AppDatabase;
  close(): Promise<void>;
}

export function createDatabaseConnection(databaseUrl = databaseUrlFromEnv()): DatabaseConnection {
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  return {
    db: drizzle(pool, { schema }),
    close: () => pool.end(),
  };
}
