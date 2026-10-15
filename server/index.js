'use strict';

const { loadDotEnv, buildConfig } = require('./config');

loadDotEnv();
const config = buildConfig();
const { createApp } = require('./app');

const server = createApp(config);

server.listen(config.port, config.host, () => {
  console.log(`🔥 TODO GAS SYR en http://localhost:${config.port}`);
  if (!config.adminToken) console.log('   Panel /admin deshabilitado (define ADMIN_TOKEN en .env para activarlo).');
  if (!config.mail.host) console.log('   Correo deshabilitado (define SMTP_HOST para recibir solicitudes por email).');
});

function shutdown(signal) {
  console.log(`\n${signal} recibido, cerrando servidor…`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
