import { InjectionToken } from '@angular/core';
import type { KeycloakInitOptions } from 'keycloak-js';

export interface KeycloakAuthConfig {
  url: string;
  realm: string;
  clientId: string;
  initOptions: KeycloakInitOptions;
}

const DEFAULT_KEYCLOAK_AUTH_CONFIG: KeycloakAuthConfig = {
  url: 'http://127.0.0.1:8080',
  realm: 'metria-demo',
  clientId: 'metria-workbench',
  initOptions: {
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    silentCheckSsoFallback: false,
  },
};

export const KEYCLOAK_AUTH_CONFIG = new InjectionToken<KeycloakAuthConfig>(
  'Metria Keycloak auth config',
  {
    factory: () => createKeycloakAuthConfig(),
  },
);

export function createKeycloakAuthConfig(
  overrides: Partial<KeycloakAuthConfig> = {},
): KeycloakAuthConfig {
  return {
    ...DEFAULT_KEYCLOAK_AUTH_CONFIG,
    ...overrides,
    initOptions: {
      ...DEFAULT_KEYCLOAK_AUTH_CONFIG.initOptions,
      ...overrides.initOptions,
    },
  };
}
