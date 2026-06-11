const realmMetadataUrl =
  process.env.KEYCLOAK_REALM_METADATA_URL ??
  'http://127.0.0.1:8080/realms/metria-demo/.well-known/openid-configuration';
const maxAttempts = Number(process.env.KEYCLOAK_WAIT_ATTEMPTS ?? 60);
const delayMs = Number(process.env.KEYCLOAK_WAIT_DELAY_MS ?? 1000);

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    const response = await fetch(realmMetadataUrl);

    if (response.ok) {
      console.log(`Keycloak is ready: ${realmMetadataUrl}`);
      process.exit(0);
    }
  } catch {
    // Keycloak is still starting.
  }

  if (attempt < maxAttempts) {
    await delay(delayMs);
  }
}

console.error(`Keycloak did not become ready after ${maxAttempts} attempts: ${realmMetadataUrl}`);
process.exit(1);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
