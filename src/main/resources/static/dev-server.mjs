import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const port = Number(process.env.PORT || 5500);

const types = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

createServer((request, response) => {
  const url = new URL(request.url || '/', `http://localhost:${port}`);
  const requestedPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, requestedPath === '/' ? 'index.html' : requestedPath);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  if (!existsSync(filePath)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': types[extname(filePath)] || 'application/octet-stream'
  });
  createReadStream(filePath).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`LocalBrew frontend: http://127.0.0.1:${port}`);
});
