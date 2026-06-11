import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildServer } from './server';

let server: FastifyInstance | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
});

describe('api server', () => {
  it('reports health', async () => {
    server = await buildServer({ logger: false });

    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'metria-api',
      version: '0.0.0',
    });
  });

  it('exposes versioned API status', async () => {
    server = await buildServer({ logger: false });

    const response = await server.inject({
      method: 'GET',
      url: '/api/status',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      service: 'metria-api',
    });
  });

  it('exposes status through GraphQL', async () => {
    server = await buildServer({ logger: false });

    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `{
          status {
            status
            service
            version
          }
        }`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        status: {
          status: 'ok',
          service: 'metria-api',
          version: '0.0.0',
        },
      },
    });
  });

  it('returns map workbench domain data through GraphQL', async () => {
    server = await buildServer({ logger: false });

    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `{
          mapWorkbench {
            defaultSelectedLayerIds
            defaultSearchTarget {
              label
              lonLat {
                lon
                lat
              }
            }
            layers {
              id
              title
              restricted
              requiredRole
            }
            features {
              id
              layerId
              geometryType
              coordinates {
                lon
                lat
              }
            }
          }
        }`,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.errors).toBeUndefined();
    expect(body.data.mapWorkbench.defaultSelectedLayerIds).toEqual([
      'property-boundaries',
      'climate-risk',
    ]);
    expect(body.data.mapWorkbench.defaultSearchTarget.label).toBe('SOLLENTUNA SJÖBERG 5:5');
    expect(body.data.mapWorkbench.layers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'protected-imagery',
          restricted: true,
          requiredRole: 'restricted-geodata',
        }),
      ]),
    );
    expect(body.data.mapWorkbench.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'property-boundary',
          layerId: 'property-boundaries',
          geometryType: 'polygon',
        }),
      ]),
    );
  });

  it('searches local Swedish targets through GraphQL', async () => {
    server = await buildServer({ logger: false });

    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `query SearchTargets($query: String!) {
          searchTargets(query: $query, limit: 1) {
            id
            label
            kind
            source
          }
        }`,
        variables: {
          query: 'Stockholm',
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        searchTargets: [
          {
            id: 'stockholm',
            label: 'Stockholm',
            kind: 'place',
            source: 'local',
          },
        ],
      },
    });
  });
});
