import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';

import { KEYCLOAK_AUTH_CONFIG, KeycloakAuthConfig, createKeycloakAuthConfig } from './auth.config';
import { AuthStore } from './auth.store';

export function provideKeycloakAuth(
  overrides: Partial<KeycloakAuthConfig> = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: KEYCLOAK_AUTH_CONFIG,
      useValue: createKeycloakAuthConfig(overrides),
    },
    provideAppInitializer(() => inject(AuthStore).initialize()),
  ]);
}
