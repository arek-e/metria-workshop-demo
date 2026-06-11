import { buildAuthUser, extractTokenRoles, toUserRoles } from './auth-state';

describe('auth state mapping', () => {
  it('maps Keycloak realm and client roles into application roles', () => {
    const token = {
      sub: 'user-123',
      preferred_username: 'demo',
      name: 'Metria Demo',
      email: 'demo@example.test',
      realm_access: {
        roles: ['case-worker', 'default-roles-metria-demo'],
      },
      resource_access: {
        'metria-workbench': {
          roles: ['exporter', 'restricted-geodata'],
        },
      },
    };

    const user = buildAuthUser(undefined, token, 'metria-workbench');

    expect(user).toMatchObject({
      id: 'user-123',
      username: 'demo',
      displayName: 'Metria Demo',
      email: 'demo@example.test',
      roles: ['case-worker', 'restricted-geodata', 'exporter'],
    });
  });

  it('keeps unknown Keycloak roles out of application authorization decisions', () => {
    expect(toUserRoles(['offline_access', 'uma_authorization', 'case-worker'])).toEqual([
      'case-worker',
    ]);
  });

  it('deduplicates raw Keycloak roles from realm and client claims', () => {
    expect(
      extractTokenRoles(
        {
          realm_access: {
            roles: ['case-worker', 'exporter'],
          },
          resource_access: {
            'metria-workbench': {
              roles: ['case-worker', 'restricted-geodata'],
            },
          },
        },
        'metria-workbench',
      ),
    ).toEqual(['case-worker', 'exporter', 'restricted-geodata']);
  });
});
