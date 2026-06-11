import pg from 'pg';

const databaseUrl =
  process.env['DATABASE_URL'] ?? 'postgresql://metria:metria@127.0.0.1:5433/metria_map';
const deadline = Date.now() + 60_000;

while (Date.now() < deadline) {
  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    await client.query('select 1');
    await client.end();
    console.log(`Application Postgres is ready: ${databaseUrl}`);
    process.exit(0);
  } catch {
    await client.end().catch(() => undefined);
    await delay(1_000);
  }
}

throw new Error(`Timed out waiting for application Postgres: ${databaseUrl}`);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
