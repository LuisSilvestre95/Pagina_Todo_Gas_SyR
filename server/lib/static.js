'use strict';

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.xml', '.txt', '.svg']);

/** Resuelve la ruta pedida dentro de publicDir, bloqueando path traversal. */
function resolveSafe(publicDir, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const target = path.normalize(path.join(publicDir, decoded));
  if (target !== publicDir && !target.startsWith(publicDir + path.sep)) return null;
  return target;
}

async function findFile(publicDir, urlPath) {
  const target = resolveSafe(publicDir, urlPath);
  if (!target) return null;
  const candidates = [target];
  if (urlPath.endsWith('/')) candidates.unshift(path.join(target, 'index.html'));
  else if (!path.extname(target)) candidates.push(`${target}.html`, path.join(target, 'index.html'));
  for (const file of candidates) {
    try {
      const stat = await fsp.stat(file);
      if (stat.isFile()) return { file, stat };
    } catch {
      /* siguiente candidato */
    }
  }
  return null;
}

function cacheControl(ext) {
  if (ext === '.html' || ext === '.webmanifest' || ext === '.xml' || ext === '.txt') return 'no-cache';
  return 'public, max-age=604800, stale-while-revalidate=86400';
}

async function serveStatic(req, res, publicDir) {
  const urlPath = new URL(req.url, 'http://x').pathname;
  let found = await findFile(publicDir, urlPath);
  let status = 200;
  if (!found) {
    found = await findFile(publicDir, '/404.html');
    status = 404;
    if (!found) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado');
    }
  }

  const ext = path.extname(found.file).toLowerCase();
  const etag = `W/"${found.stat.size.toString(16)}-${Math.floor(found.stat.mtimeMs).toString(16)}"`;
  const headers = {
    'content-type': MIME[ext] || 'application/octet-stream',
    'cache-control': status === 404 ? 'no-store' : cacheControl(ext),
    etag,
    'last-modified': found.stat.mtime.toUTCString(),
    vary: 'Accept-Encoding',
  };

  if (status === 200 && req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }

  const accept = String(req.headers['accept-encoding'] || '');
  let stream = fs.createReadStream(found.file);
  if (COMPRESSIBLE.has(ext) && found.stat.size > 1024) {
    if (/\bbr\b/.test(accept)) {
      headers['content-encoding'] = 'br';
      stream = stream.pipe(zlib.createBrotliCompress());
    } else if (/\bgzip\b/.test(accept)) {
      headers['content-encoding'] = 'gzip';
      stream = stream.pipe(zlib.createGzip());
    }
  }
  if (!headers['content-encoding']) headers['content-length'] = found.stat.size;

  res.writeHead(status, headers);
  if (req.method === 'HEAD') return res.end();
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}

module.exports = { serveStatic, resolveSafe };
