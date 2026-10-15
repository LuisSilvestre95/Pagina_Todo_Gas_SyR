'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildConfig } = require('../server/config');
const { createApp } = require('../server/app');

const silent = { info() {}, warn() {}, error() {} };
let server;
let base;
let dataDir;

const valida = {
  tipoCliente: 'hogar',
  servicio: 'gas-natural',
  municipio: 'Tunja',
  nombre: 'María Pérez',
  telefono: '320 948 5534',
  email: 'maria@example.com',
  mensaje: 'Necesito conectar mi casa a gas natural.',
  aceptaPolitica: true,
  website: '',
  startedAt: Date.now() - 60_000,
};

function post(body, headers = {}) {
  return fetch(`${base}/api/contacto`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tgs-'));
  const config = buildConfig({
    port: 0,
    dataDir,
    adminToken: 'secreto-de-prueba',
    rateLimit: { windowMs: 60_000, max: 6 },
    mail: { host: '' },
    webhookUrl: '',
    logRequests: false,
  });
  server = createApp(config, { log: silent });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test('sirve la página principal con cabeceras de seguridad', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.ok(res.headers.get('content-security-policy'));
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  const html = await res.text();
  assert.match(html, /TODO GAS SYR/);
});

test('sirve recursos estáticos con caché y devuelve 404 personalizado', async () => {
  const css = await fetch(`${base}/css/styles.css`);
  assert.equal(css.status, 200);
  assert.match(css.headers.get('cache-control'), /max-age/);

  const missing = await fetch(`${base}/no-existe`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /no lleva a ningún lado/);
});

test('bloquea path traversal', async () => {
  const res = await fetch(`${base}/..%2f..%2fpackage.json`);
  assert.equal(res.status, 404);
  assert.doesNotMatch(await res.text(), /todo-gas-syr-web/);
});

test('health check', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
});

test('guarda una solicitud válida y devuelve radicado + enlace de WhatsApp', async () => {
  const res = await post(valida);
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.match(body.radicado, /^TGS-\d{4}-\d{4}$/);
  assert.match(body.whatsappUrl, /^https:\/\/wa\.me\/573209485534\?text=/);

  const saved = JSON.parse(fs.readFileSync(path.join(dataDir, 'solicitudes.json'), 'utf8'));
  assert.equal(saved[0].nombre, 'María Pérez');
  assert.equal(saved[0].estado, 'nueva');
});

test('rechaza datos inválidos con errores por campo', async () => {
  const res = await post({ ...valida, nombre: 'A', telefono: '12', aceptaPolitica: false, servicio: 'x' });
  assert.equal(res.status, 422);
  const { errors } = await res.json();
  assert.ok(errors.nombre && errors.telefono && errors.aceptaPolitica && errors.servicio);
});

test('rechaza JSON mal formado y tipos de contenido incorrectos', async () => {
  assert.equal((await post('{malo')).status, 400);
  const res = await fetch(`${base}/api/contacto`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hola' });
  assert.equal(res.status, 415);
});

test('el campo trampa engaña al bot sin guardar nada', async () => {
  const antes = JSON.parse(fs.readFileSync(path.join(dataDir, 'solicitudes.json'), 'utf8')).length;
  const res = await post({ ...valida, website: 'http://spam' });
  assert.equal(res.status, 200);
  const despues = JSON.parse(fs.readFileSync(path.join(dataDir, 'solicitudes.json'), 'utf8')).length;
  assert.equal(despues, antes);
});

test('panel admin: exige token, lista, cambia estado y exporta CSV', async () => {
  assert.equal((await fetch(`${base}/api/admin/solicitudes`)).status, 401);

  const auth = { authorization: 'Bearer secreto-de-prueba' };
  const list = await (await fetch(`${base}/api/admin/solicitudes`, { headers: auth })).json();
  assert.ok(list.solicitudes.length >= 1);
  const id = list.solicitudes[0].id;

  const patch = await fetch(`${base}/api/admin/solicitudes/${id}`, {
    method: 'PATCH',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ estado: 'contactada' }),
  });
  assert.equal(patch.status, 200);
  assert.equal((await patch.json()).solicitud.estado, 'contactada');

  const bad = await fetch(`${base}/api/admin/solicitudes/${id}`, {
    method: 'PATCH',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ estado: 'inventado' }),
  });
  assert.equal(bad.status, 404);

  const csv = await fetch(`${base}/api/admin/solicitudes.csv`, { headers: auth });
  assert.equal(csv.status, 200);
  const text = await csv.text();
  assert.match(text, /radicado,creada,estado/);
  assert.match(text, /María Pérez/);
});

test('limita la cantidad de envíos por IP', async () => {
  let last;
  for (let i = 0; i < 6; i++) last = await post({ ...valida, nombre: `Cliente Número ${'abcdef'[i]}` });
  assert.equal(last.status, 429);
  assert.ok(last.headers.get('retry-after'));
});
