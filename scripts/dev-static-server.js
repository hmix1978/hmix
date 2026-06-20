const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || process.argv[2] || 4173);
const host = process.env.HOST || '127.0.0.1';
const quiet = process.env.HMIX_DEV_SERVER_QUIET === '1' || process.argv.includes('--quiet');

const types = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

function resolveRequest(url) {
  const requestUrl = new URL(url, `http://${host}:${port}`);
  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const normalized = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const localPath = path.join(root, normalized);
  return localPath.endsWith(path.sep) ? path.join(localPath, 'index.html') : localPath;
}

const server = http.createServer((req, res) => {
  let filePath;
  try {
    filePath = resolveRequest(req.url || '/');
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    if (statErr) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const finalPath = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const ext = path.extname(finalPath).toLowerCase();
    res.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': types[ext] || 'application/octet-stream',
    });
    fs.createReadStream(finalPath).pipe(res);
  });
});

server.on('error', (err) => {
  console.error(`[dev-static-server] ${err.code || 'ERROR'}: ${err.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  if (!quiet) {
    console.log(`Serving ${root} at http://${host}:${port}/`);
  }
});
