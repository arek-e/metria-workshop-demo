import type { KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js';

import { UserRole } from '../shared/domain/user-role';
import { AuthState, AuthUser } from './auth.models';

export const AUTH_INITIAL_STATE: AuthState = {
  status: 'initializing',
};

const KNOWN_USER_ROLES: readonly UserRole[] = ['case-worker', 'restricted-geodata', 'exporter'];

export function buildAuthUser(
  profile: KeycloakProfile | undefined,
  token: KeycloakTokenParsed | undefined,
  clientId: string,
): AuthUser {
  const rawRoles = extractTokenRoles(token, clientId);
  const username = stringClaim(token, 'preferred_username') ?? profile?.username ?? 'user';
  const displayName =
    stringClaim(token, 'name') ?? joinName(profile?.firstName, profile?.lastName) ?? username;

  return {
    id: token?.sub ?? profile?.id ?? username,
    username,
    displayName,
    email: stringClaim(token, 'email') ?? profile?.email,
    roles: toUserRoles(rawRoles),
    rawRoles,
  };
}

export function extractTokenRoles(
  token: KeycloakTokenParsed | undefined,
  clientId: string,
): readonly string[] {
  const realmRoles = token?.realm_access?.roles ?? [];
  const clientRoles = token?.resource_access?.[clientId]?.roles ?? [];

  return [...new Set([...realmRoles, ...clientRoles])].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function toUserRoles(rawRoles: readonly string[]): readonly UserRole[] {
  const roleSet = new Set(rawRoles);

  return KNOWN_USER_ROLES.filter((role) => roleSet.has(role));
}

function stringClaim(token: KeycloakTokenParsed | undefined, claim: string): string | undefined {
  const value = token?.[claim];

  return typeof value === 'string' && value.trim() ? value : undefined;
}

function joinName(firstName: string | undefined, lastName: string | undefined): string | undefined {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();

  return name || undefined;
}
