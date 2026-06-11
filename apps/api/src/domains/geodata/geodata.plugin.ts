import type { FastifyPluginAsync } from 'fastify';
import mercurius from 'mercurius';

import { createDatabaseConnection } from '../../db/client';
import { DrizzleGeodataRepository } from './geodata.drizzle-repository';
import { buildGeodataResolvers, geodataSchema } from './geodata.graphql';
import { GeodataRepository } from './geodata.repository';

export interface GeodataGraphqlPluginOptions {
  readonly databaseUrl?: string;
  readonly graphqlIde?: boolean;
  readonly repository?: GeodataRepository;
}

export const geodataGraphqlPlugin: FastifyPluginAsync<GeodataGraphqlPluginOptions> = async (
  server,
  options,
) => {
  const connection = options.repository ? undefined : createDatabaseConnection(options.databaseUrl);
  const repository =
    options.repository ?? new DrizzleGeodataRepository(assertConnection(connection).db);

  if (connection) {
    server.addHook('onClose', async () => {
      await connection.close();
    });
  }

  const graphqlIdeEnabled = options.graphqlIde ?? process.env['NODE_ENV'] !== 'production';

  if (graphqlIdeEnabled) {
    server.addHook('onRequest', async (request, reply) => {
      const acceptsHtml = request.headers.accept?.includes('text/html') ?? false;

      if (request.method === 'GET' && request.url === '/graphql' && acceptsHtml) {
        return reply.redirect('/graphiql');
      }
    });
  }

  await server.register(mercurius, {
    schema: geodataSchema,
    resolvers: buildGeodataResolvers(repository),
    graphiql: graphqlIdeEnabled,
    path: '/graphql',
  });
};

function assertConnection(connection: ReturnType<typeof createDatabaseConnection> | undefined) {
  if (!connection) {
    throw new Error('A database connection is required when no geodata repository is provided.');
  }

  return connection;
}
