import type { FastifyPluginAsync } from 'fastify';
import mercurius from 'mercurius';

import { buildGeodataResolvers, geodataSchema } from './geodata.graphql';

export const geodataGraphqlPlugin: FastifyPluginAsync = async (server) => {
  await server.register(mercurius, {
    schema: geodataSchema,
    resolvers: buildGeodataResolvers(),
    graphiql: process.env['NODE_ENV'] !== 'production',
    path: '/graphql',
  });
};
