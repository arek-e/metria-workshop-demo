import { createDatabaseConnection } from './client';
import { seedGeodata } from '../domains/geodata/geodata.seed';

void main();

async function main(): Promise<void> {
  const connection = createDatabaseConnection();

  try {
    await seedGeodata(connection.db);
    console.log('Application geodata seed complete.');
  } finally {
    await connection.close();
  }
}
