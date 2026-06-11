import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';

export interface BuildServerOptions {
  readonly logger?: boolean;
  readonly corsOrigin?: boolean | string | RegExp | Array<string | RegExp>;
}

export interface ApiStatusResponse {
  readonly status: 'ok';
  readonly service: 'metria-api';
  readonly version: string;
}

export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const server = Fastify({
    logger: options.logger ?? true,
  });

  await server.register(cors, {
    origin: options.corsOrigin ?? true,
  });

  server.get('/health', async (): Promise<ApiStatusResponse> => buildStatusResponse());
  server.get('/api/status', async (): Promise<ApiStatusResponse> => buildStatusResponse());

  return server;
}

function buildStatusResponse(): ApiStatusResponse {
  return {
    status: 'ok',
    service: 'metria-api',
    version: process.env['npm_package_version'] ?? '0.0.0',
  };
}
