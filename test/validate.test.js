'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarSolicitud, pareceBot } = require('../server/lib/validate');
const { resolveSafe } = require('../server/lib/static');

const base = {
  tipoCliente: 'comercio',
  servicio: 'glp',
  municipio: 'Garagoa',
  nombre: 'José Núñez',
  telefono: '+57 322 361 8360',
  mensaje: 'Restaurante con tres estufas industriales.',
  aceptaPolitica: true,
};

test('acepta una solicitud correcta y normaliza el correo', () => {
  const r = validarSolicitud({ ...base, email: '  Jose@Example.COM ' });
  assert.equal(r.ok, true);
  assert.equal(r.data.email, 'jose@example.com');
});

test('limpia caracteres de control y recorta longitudes', () => {
  const r = validarSolicitud({ ...base, mensaje: `Hola\u0000 mundo ${'x'.repeat(3000)}` });
  assert.equal(r.ok, true);
  assert.ok(!r.data.mensaje.includes('\u0000'));
  assert.equal(r.data.mensaje.length, 1500);
});

test('rechaza correos y nombres inválidos', () => {
  const r = validarSolicitud({ ...base, email: 'no-es-correo', nombre: '<script>' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.email);
  assert.ok(r.errors.nombre);
});

test('rechaza cuerpos que no son objetos', () => {
  assert.equal(validarSolicitud(null).ok, false);
  assert.equal(validarSolicitud([1, 2]).ok, false);
});

test('detecta bots por campo trampa o velocidad', () => {
  assert.equal(pareceBot({ website: 'x' }), true);
  assert.equal(pareceBot({ startedAt: Date.now() - 500 }), true);
  assert.equal(pareceBot({ startedAt: Date.now() - 30_000, website: '' }), false);
});

test('resolveSafe no permite salir de la carpeta pública', () => {
  const pub = '/srv/public';
  assert.equal(resolveSafe(pub, '/css/styles.css'), '/srv/public/css/styles.css');
  assert.equal(resolveSafe(pub, '/../../etc/passwd'), null);
  assert.equal(resolveSafe(pub, '/%2e%2e/%2e%2e/etc/passwd'), null);
  assert.equal(resolveSafe(pub, '/a%00b'), null);
  assert.equal(resolveSafe(pub, '/%E0%A4%A'), null);
});
