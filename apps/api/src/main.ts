import { buildServer } from './server';

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '127.0.0.1';

async function start(): Promise<void> {
  const server = await buildServer({
    logger: true,
    corsOrigin: process.env['API_CORS_ORIGIN'] ?? true,
  });

  try {
    const port = Number(process.env['API_PORT'] ?? process.env['PORT'] ?? DEFAULT_PORT);
    const host = process.env['API_HOST'] ?? DEFAULT_HOST;

    await server.listen({ port, host });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    server.log.info({ signal }, 'Shutting down API server');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void start();
