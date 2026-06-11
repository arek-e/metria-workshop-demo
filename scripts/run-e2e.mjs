import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const port = process.env['E2E_PORT'] ?? String(await findOpenPort());
const baseUrl = process.env['CYPRESS_BASE_URL'] ?? `http://127.0.0.1:${port}`;
const serve = spawn('npx', ['ng', 'serve', 'web', '--host', '127.0.0.1', '--port', port], {
  stdio: 'inherit',
  env: {
    ...process.env,
    FORCE_COLOR: '1',
  },
});

try {
  await waitForServer(baseUrl);
  await run('npx', ['cypress', 'run', '--project', 'apps/web-e2e'], {
    CYPRESS_BASE_URL: baseUrl,
  });
} finally {
  serve.kill('SIGTERM');
}

async function waitForServer(url) {
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Dev server is still starting.
    }

    await delay(1_000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...env,
      },
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Could not allocate an E2E port.')));
        return;
      }

      server.close(() => resolve(address.port));
    });
  });
}
