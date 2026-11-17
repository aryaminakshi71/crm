const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const CLIENT_DIR = path.join(__dirname, 'dist/client');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function serveFile(filePath, res) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];

  // Always serve index.html for SPA routes (all non-file routes)
  const indexPath = path.join(CLIENT_DIR, 'index.html');

  // Check if it's a file request (has extension)
  const hasExtension = path.extname(url) && !url.endsWith('/');

  if (hasExtension) {
    // Try to serve the file directly
    let filePath = path.join(CLIENT_DIR, url);

    if (fs.existsSync(filePath)) {
      serveFile(filePath, res);
      return;
    }

    // Check in assets folder
    const assetsPath = path.join(CLIENT_DIR, 'assets', path.basename(url));
    if (fs.existsSync(assetsPath)) {
      serveFile(assetsPath, res);
      return;
    }
  }

  // For SPA, serve index.html for all routes
  if (fs.existsSync(indexPath)) {
    serveFile(indexPath, res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`SPA server running at http://localhost:${PORT}`);
});
