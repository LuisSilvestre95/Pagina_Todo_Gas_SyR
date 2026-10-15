'use strict';

const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

/** Lee un .env sencillo (CLAVE=valor) sin depender de paquetes externos. */
function loadDotEnv(file = path.join(ROOT, '.env')) {
  let raw;
  try {
    raw = require('node:fs').readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

function buildConfig(overrides = {}) {
  const env = process.env;
  return {
    port: Number(env.PORT) || 3000,
    host: env.HOST || '0.0.0.0',
    publicDir: path.join(ROOT, 'public'),
    dataDir: env.DATA_DIR ? path.resolve(env.DATA_DIR) : path.join(ROOT, 'data'),
    siteUrl: (env.SITE_URL || 'https://luissilvestre95.github.io/Pagina_Todo_Gas_SyR').replace(/\/$/, ''),
    adminToken: env.ADMIN_TOKEN || '',
    trustProxy: env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true',
    rateLimit: {
      windowMs: Number(env.RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
      max: Number(env.RATE_LIMIT_MAX) || 5,
    },
    mail: {
      host: env.SMTP_HOST || '',
      port: Number(env.SMTP_PORT) || 587,
      secure: env.SMTP_SECURE === 'true',
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
      from: env.MAIL_FROM || 'TODO GAS SYR <todogassyr@hotmail.com>',
      to: env.MAIL_TO || 'todogassyr@hotmail.com',
    },
    webhookUrl: env.WEBHOOK_URL || '',
    whatsapp: env.WHATSAPP_NUMBER || '573209485534',
    ...overrides,
  };
}

module.exports = { ROOT, loadDotEnv, buildConfig };
