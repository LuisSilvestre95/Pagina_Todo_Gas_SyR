'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const { serveStatic } = require('./lib/static');
const { validarSolicitud, pareceBot } = require('./lib/validate');
const { createStore } = require('./lib/store');
const { createRateLimiter } = require('./lib/rate-limit');
const { notificar, resumen } = require('./lib/notify');

const MAX_BODY = 20 * 1024;

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
  'frame-src https://www.google.com https://maps.google.com',
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
].join('; ');

const SECURITY_HEADERS = {
  'content-security-policy': CSP,
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'cross-origin-opener-policy': 'same-origin',
};

function sendJson(res, status, payload, extra = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
    ...extra,
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const type = String(req.headers['content-type'] || '');
    if (!type.includes('application/json')) return reject(Object.assign(new Error('Se esperaba JSON'), { status: 415 }));
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Solicitud demasiado grande'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('JSON inválido'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function clientIp(req, trustProxy) {
  if (trustProxy) {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress || 'desconocida';
}

function tokenOk(req, expected) {
  if (!expected) return false;
  const given = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function csvCell(v) {
  const s = v === undefined || v === null ? '' : String(v);
  // Evita inyección de fórmulas al abrir el CSV en Excel.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

function waLink(numero, texto) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

function createApp(config, { log = console } = {}) {
  const store = createStore(config.dataDir);
  const limit = createRateLimiter(config.rateLimit);

  async function handleApi(req, res, pathname) {
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, servicio: 'todo-gas-syr', hora: new Date().toISOString() });
    }

    if (pathname === '/api/contacto') {
      if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Método no permitido' }, { allow: 'POST' });

      const rl = limit(clientIp(req, config.trustProxy));
      if (!rl.allowed) {
        return sendJson(
          res,
          429,
          { ok: false, error: 'Has enviado varias solicitudes seguidas. Intenta de nuevo en unos minutos o escríbenos por WhatsApp.' },
          { 'retry-after': String(rl.retryAfter) },
        );
      }

      const body = await readJson(req);
      if (pareceBot(body)) {
        // Respuesta "exitosa" para no dar pistas al bot; no se guarda nada.
        return sendJson(res, 200, { ok: true, radicado: 'TGS-OK' });
      }

      const result = validarSolicitud(body);
      if (!result.ok) return sendJson(res, 422, { ok: false, error: 'Revisa los campos marcados.', errors: result.errors });

      const solicitud = await store.add({
        ...result.data,
        origen: String(req.headers.referer || '').slice(0, 200),
      });
      notificar(config, solicitud, log).catch(() => {});

      return sendJson(res, 201, {
        ok: true,
        radicado: solicitud.radicado,
        whatsappUrl: waLink(config.whatsapp, `Hola TODO GAS SYR, acabo de enviar la solicitud ${solicitud.radicado} desde la página web.\n\n${resumen(solicitud)}`),
      });
    }

    if (pathname.startsWith('/api/admin/')) {
      if (!config.adminToken) return sendJson(res, 503, { ok: false, error: 'Panel deshabilitado: define ADMIN_TOKEN.' });
      if (!tokenOk(req, config.adminToken)) return sendJson(res, 401, { ok: false, error: 'No autorizado' });

      if (pathname === '/api/admin/solicitudes' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, solicitudes: await store.list() });
      }

      if (pathname === '/api/admin/solicitudes.csv' && req.method === 'GET') {
        const cols = ['radicado', 'creada', 'estado', 'nombre', 'empresa', 'telefono', 'email', 'tipoCliente', 'servicio', 'municipio', 'mensaje'];
        const rows = (await store.list()).map((s) => cols.map((c) => csvCell(s[c])).join(','));
        const csv = '﻿' + [cols.join(','), ...rows].join('\r\n');
        res.writeHead(200, {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': `attachment; filename="solicitudes-todo-gas-${new Date().toISOString().slice(0, 10)}.csv"`,
          'cache-control': 'no-store',
        });
        return res.end(csv);
      }

      const m = pathname.match(/^\/api\/admin\/solicitudes\/([0-9a-f-]{36})$/);
      if (m && req.method === 'PATCH') {
        const body = await readJson(req);
        const item = await store.setEstado(m[1], String(body.estado || ''));
        if (!item) return sendJson(res, 404, { ok: false, error: 'Solicitud o estado no válido' });
        return sendJson(res, 200, { ok: true, solicitud: item });
      }
    }

    return sendJson(res, 404, { ok: false, error: 'Ruta no encontrada' });
  }

  const server = http.createServer(async (req, res) => {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
    const started = Date.now();
    const { pathname } = new URL(req.url, 'http://x');
    if (pathname.startsWith('/api/') && config.logRequests !== false) {
      res.on('finish', () => log.info?.(`${req.method} ${pathname} ${res.statusCode} ${Date.now() - started}ms`));
    }

    try {
      if (pathname.startsWith('/api/')) await handleApi(req, res, pathname);
      else if (req.method === 'GET' || req.method === 'HEAD') await serveStatic(req, res, config.publicDir);
      else sendJson(res, 405, { ok: false, error: 'Método no permitido' });
    } catch (err) {
      const status = err.status || 500;
      if (status >= 500) log.error('[error]', err);
      if (!res.headersSent) sendJson(res, status, { ok: false, error: status >= 500 ? 'Error interno. Escríbenos por WhatsApp.' : err.message });
      else res.end();
    }
  });

  return server;
}

module.exports = { createApp };
