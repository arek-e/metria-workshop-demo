import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';

import { geodataGraphqlPlugin } from './domains/geodata/geodata.plugin';
import { GeodataRepository } from './domains/geodata/geodata.repository';
import { ApiStatusResponse, buildStatusResponse } from './domains/system/status';

export interface BuildServerOptions {
  readonly logger?: boolean;
  readonly corsOrigin?: boolean | string | RegExp | Array<string | RegExp>;
  readonly databaseUrl?: string;
  readonly graphqlIde?: boolean;
  readonly geodataRepository?: GeodataRepository;
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
  await server.register(geodataGraphqlPlugin, {
    databaseUrl: options.databaseUrl,
    graphqlIde: options.graphqlIde,
    repository: options.geodataRepository,
  });

  return server;
}
