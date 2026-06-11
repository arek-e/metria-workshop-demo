export interface ApiStatusResponse {
  readonly status: 'ok';
  readonly service: 'metria-api';
  readonly version: string;
}

export function buildStatusResponse(): ApiStatusResponse {
  return {
    status: 'ok',
    service: 'metria-api',
    version: process.env['npm_package_version'] ?? '0.0.0',
  };
}
