import { defineConfig } from 'cypress';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const artifactRoot = join(tmpdir(), 'metria-ai-quality-workbench-cypress');

export default defineConfig({
  allowCypressEnv: false,
  downloadsFolder: join(artifactRoot, 'downloads'),
  screenshotsFolder: join(artifactRoot, 'screenshots'),
  videosFolder: join(artifactRoot, 'videos'),
  video: false,
  e2e: {
    baseUrl: process.env['CYPRESS_BASE_URL'] ?? 'http://127.0.0.1:4300',
    specPattern: 'src/e2e/**/*.cy.ts',
    supportFile: false,
    viewportWidth: 1440,
    viewportHeight: 900,
  },
});
