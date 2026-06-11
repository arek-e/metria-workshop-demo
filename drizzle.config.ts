import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './apps/api/src/db/schema.ts',
  out: './apps/api/drizzle',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://metria:metria@127.0.0.1:5433/metria_map',
  },
});
