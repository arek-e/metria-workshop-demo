import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { createServer as createTcpServer } from 'node:net';

const port = process.env['E2E_PORT'] ?? String(await findOpenPort());
const apiPort = process.env['E2E_API_PORT'] ?? '3000';
const baseUrl = process.env['CYPRESS_BASE_URL'] ?? `http://127.0.0.1:${port}`;
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const webRoot = resolve('dist/apps/web/browser');

await run('npm', ['run', 'services']);
await run('npx', ['ng', 'build', 'web', '--configuration', 'development']);

const api = spawn('npx', ['nx', 'serve', 'api'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    API_PORT: apiPort,
    FORCE_COLOR: '1',
  },
});
const web = await startStaticServer(webRoot, port);

try {
  await waitForServer(`${apiBaseUrl}/health`);
  await waitForServer(baseUrl);
  await run('npx', ['cypress', 'run', '--project', 'apps/web-e2e'], {
    CYPRESS_BASE_URL: baseUrl,
  });
} finally {
  api.kill('SIGTERM');
  await closeServer(web);
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

function startStaticServer(root, listenPort) {
  const server = createHttpServer(async (request, response) => {
    try {
      const filePath = await resolveStaticFile(root, request.url ?? '/');

      response.writeHead(200, {
        'content-type': contentTypeFor(filePath),
        'cache-control': 'no-cache',
      });
      createReadStream(filePath).pipe(response);
    } catch (error) {
      response.writeHead(500, {
        'content-type': 'text/plain; charset=utf-8',
      });
      response.end(error instanceof Error ? error.message : 'Static server error');
    }
  });

  return new Promise((resolveServer, reject) => {
    server.on('error', reject);
    server.listen(Number(listenPort), '127.0.0.1', () => resolveServer(server));
  });
}

async function resolveStaticFile(root, requestUrl) {
  const url = new URL(requestUrl, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname);
  const candidate = safeResolve(root, pathname === '/' ? 'index.html' : pathname.slice(1));
  const candidateStat = await stat(candidate).catch(() => undefined);

  if (candidateStat?.isFile()) {
    return candidate;
  }

  if (candidateStat?.isDirectory()) {
    const indexPath = join(candidate, 'index.html');
    const indexStat = await stat(indexPath).catch(() => undefined);
    if (indexStat?.isFile()) {
      return indexPath;
    }
  }

  return join(root, 'index.html');
}

function safeResolve(root, requestPath) {
  const resolvedPath = resolve(root, requestPath);
  const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;

  if (resolvedPath === root || resolvedPath.startsWith(rootPrefix)) {
    return resolvedPath;
  }

  return join(root, 'index.html');
}

function contentTypeFor(filePath) {
  const extension = extname(filePath);

  if (extension === '.css') {
    return 'text/css; charset=utf-8';
  }

  if (extension === '.js') {
    return 'text/javascript; charset=utf-8';
  }

  if (extension === '.json') {
    return 'application/json; charset=utf-8';
  }

  if (extension === '.svg') {
    return 'image/svg+xml';
  }

  if (extension === '.woff2') {
    return 'font/woff2';
  }

  return 'text/html; charset=utf-8';
}

function closeServer(server) {
  return new Promise((resolveClose, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolveClose();
    });
  });
}

function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = createTcpServer();
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
