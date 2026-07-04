const http = require('http');
const fs = require('fs');
const path = require('path');

<<<<<<< HEAD
const root = path.resolve(__dirname);
=======
const root = __dirname;
>>>>>>> 0db2c72c2ef413d2f2a60a97f2bbb459770fdcfc
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
<<<<<<< HEAD
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1:5000');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';

    const file = path.resolve(root, `.${pathname}`);
    
    // FIX: Path traversal security fix
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(data);
    });
  } catch (err) {
    // FIX: Prevents unhandled crashes from malformed URI component parameters
    res.writeHead(400);
    res.end('Bad Request: Malformed URL');
  }
}).listen(5000, '127.0.0.1');
=======
  const url = new URL(req.url || '/', 'http://127.0.0.1:5000');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';

  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(5000, '127.0.0.1');
>>>>>>> 0db2c72c2ef413d2f2a60a97f2bbb459770fdcfc
