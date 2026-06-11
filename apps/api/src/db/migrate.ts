import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { createDatabaseConnection } from './client';

void main();

async function main(): Promise<void> {
  const connection = createDatabaseConnection();

  try {
    await migrate(connection.db, {
      migrationsFolder: 'apps/api/drizzle',
    });
    console.log('Application database migrations applied.');
  } finally {
    await connection.close();
  }
}
