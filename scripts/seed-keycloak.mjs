import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const keycloakBaseUrl = process.env.KEYCLOAK_URL ?? 'http://127.0.0.1:8080';
const adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME ?? 'admin';
const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD ?? 'admin';
const realmFile =
  process.env.KEYCLOAK_REALM_FILE ??
  resolve(scriptDir, '../docker/keycloak/metria-demo-realm.json');

const realm = JSON.parse(await readFile(realmFile, 'utf8'));
const accessToken = await getAdminAccessToken();

await ensureRealm();
await ensureRealmRoles();
await ensureClients();
await ensureUsers();

console.log(`Keycloak seed complete: realm=${realm.realm}`);

async function ensureRealm() {
  const existingRealm = await fetchJson(`/admin/realms/${pathPart(realm.realm)}`, {
    allowedStatuses: [200, 404],
  });

  if (existingRealm.status === 200) {
    return;
  }

  await fetchJson('/admin/realms', {
    method: 'POST',
    body: realm,
    allowedStatuses: [201, 204, 409],
  });
}

async function ensureRealmRoles() {
  for (const role of realm.roles?.realm ?? []) {
    const existingRole = await fetchJson(
      `/admin/realms/${pathPart(realm.realm)}/roles/${pathPart(role.name)}`,
      {
        allowedStatuses: [200, 404],
      },
    );

    if (existingRole.status === 404) {
      await fetchJson(`/admin/realms/${pathPart(realm.realm)}/roles`, {
        method: 'POST',
        body: role,
        allowedStatuses: [201, 204, 409],
      });
      continue;
    }

    await fetchJson(`/admin/realms/${pathPart(realm.realm)}/roles/${pathPart(role.name)}`, {
      method: 'PUT',
      body: role,
      allowedStatuses: [204],
    });
  }
}

async function ensureClients() {
  for (const client of realm.clients ?? []) {
    const matches = await fetchJson(
      `/admin/realms/${pathPart(realm.realm)}/clients?clientId=${queryPart(client.clientId)}`,
    );
    const existingClient = matches.body[0];

    if (!existingClient) {
      await fetchJson(`/admin/realms/${pathPart(realm.realm)}/clients`, {
        method: 'POST',
        body: client,
        allowedStatuses: [201, 204, 409],
      });
      continue;
    }

    await fetchJson(
      `/admin/realms/${pathPart(realm.realm)}/clients/${pathPart(existingClient.id)}`,
      {
        method: 'PUT',
        body: {
          ...client,
          id: existingClient.id,
        },
        allowedStatuses: [204],
      },
    );
  }
}

async function ensureUsers() {
  for (const user of realm.users ?? []) {
    const existingUsers = await fetchJson(
      `/admin/realms/${pathPart(realm.realm)}/users?username=${queryPart(
        user.username,
      )}&exact=true`,
    );
    const userPayload = toUserPayload(user);
    let userId = existingUsers.body[0]?.id;

    if (!userId) {
      await fetchJson(`/admin/realms/${pathPart(realm.realm)}/users`, {
        method: 'POST',
        body: userPayload,
        allowedStatuses: [201, 204, 409],
      });
      const createdUsers = await fetchJson(
        `/admin/realms/${pathPart(realm.realm)}/users?username=${queryPart(
          user.username,
        )}&exact=true`,
      );
      userId = createdUsers.body[0]?.id;
    } else {
      await fetchJson(`/admin/realms/${pathPart(realm.realm)}/users/${pathPart(userId)}`, {
        method: 'PUT',
        body: {
          ...userPayload,
          id: userId,
        },
        allowedStatuses: [204],
      });
    }

    if (!userId) {
      throw new Error(`Could not resolve Keycloak user id for ${user.username}`);
    }

    await ensurePassword(userId, user);
    await ensureRealmRoleMappings(userId, user.realmRoles ?? []);
  }
}

async function ensurePassword(userId, user) {
  const password = user.credentials?.find((credential) => credential.type === 'password');

  if (!password) {
    return;
  }

  await fetchJson(
    `/admin/realms/${pathPart(realm.realm)}/users/${pathPart(userId)}/reset-password`,
    {
      method: 'PUT',
      body: password,
      allowedStatuses: [204],
    },
  );
}

async function ensureRealmRoleMappings(userId, roleNames) {
  if (!roleNames.length) {
    return;
  }

  const currentMappings = await fetchJson(
    `/admin/realms/${pathPart(realm.realm)}/users/${pathPart(userId)}/role-mappings/realm`,
  );
  const currentRoleNames = new Set(currentMappings.body.map((role) => role.name));
  const missingRoles = [];

  for (const roleName of roleNames) {
    if (currentRoleNames.has(roleName)) {
      continue;
    }

    const role = await fetchJson(
      `/admin/realms/${pathPart(realm.realm)}/roles/${pathPart(roleName)}`,
    );
    missingRoles.push(role.body);
  }

  if (!missingRoles.length) {
    return;
  }

  await fetchJson(
    `/admin/realms/${pathPart(realm.realm)}/users/${pathPart(userId)}/role-mappings/realm`,
    {
      method: 'POST',
      body: missingRoles,
      allowedStatuses: [204],
    },
  );
}

function toUserPayload(user) {
  const { credentials, realmRoles, clientRoles, ...payload } = user;

  return payload;
}

async function getAdminAccessToken() {
  const response = await fetch(`${keycloakBaseUrl}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: adminUsername,
      password: adminPassword,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Could not get Keycloak admin token: ${response.status} ${await response.text()}`,
    );
  }

  const tokenResponse = await response.json();

  if (typeof tokenResponse.access_token !== 'string') {
    throw new Error('Keycloak admin token response did not include access_token.');
  }

  return tokenResponse.access_token;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${keycloakBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const allowedStatuses = options.allowedStatuses ?? [200];

  if (!allowedStatuses.includes(response.status)) {
    throw new Error(
      `${options.method ?? 'GET'} ${path} failed: ${response.status} ${await response.text()}`,
    );
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {
      status: response.status,
      body: undefined,
    };
  }

  const text = await response.text();

  return {
    status: response.status,
    body: text ? JSON.parse(text) : undefined,
  };
}

function pathPart(value) {
  return encodeURIComponent(value);
}

function queryPart(value) {
  return encodeURIComponent(value);
}
