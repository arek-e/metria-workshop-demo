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
});
