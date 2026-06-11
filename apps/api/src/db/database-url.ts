export function databaseUrlFromEnv(): string {
  return process.env['DATABASE_URL'] ?? 'postgresql://metria:metria@127.0.0.1:5433/metria_map';
}
