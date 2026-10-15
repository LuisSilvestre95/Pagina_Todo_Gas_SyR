'use strict';

const ETIQUETAS = {
  'gas-natural': 'Redes de gas natural',
  glp: 'Sistemas de GLP',
  mantenimiento: 'Mantenimiento y reparación',
  'obra-civil': 'Obra civil',
  'revision-certificacion': 'Revisión / pruebas de hermeticidad',
  emergencia: 'Emergencia',
  otro: 'Otro',
  hogar: 'Hogar',
  comercio: 'Comercio',
  industria: 'Industria',
  constructora: 'Constructora',
  'empresa-servicios': 'Empresa de servicios públicos',
};

function resumen(s) {
  return [
    `Radicado: ${s.radicado}`,
    `Nombre: ${s.nombre}`,
    s.empresa && `Empresa: ${s.empresa}`,
    `Teléfono: ${s.telefono}`,
    s.email && `Correo: ${s.email}`,
    `Tipo de cliente: ${ETIQUETAS[s.tipoCliente] || s.tipoCliente}`,
    `Servicio: ${ETIQUETAS[s.servicio] || s.servicio}`,
    `Municipio: ${s.municipio}`,
    '',
    s.mensaje,
  ]
    .filter((l) => l !== undefined && l !== false && l !== '')
    .join('\n');
}

/**
 * Envía la notificación por correo (si hay SMTP y nodemailer instalado) y por
 * webhook (si WEBHOOK_URL está definido). Nunca lanza: los fallos se registran
 * y la solicitud queda guardada de todas formas.
 */
async function notificar(config, solicitud, log = console) {
  const tareas = [];

  if (config.mail.host) {
    tareas.push(
      (async () => {
        let nodemailer;
        try {
          nodemailer = require('nodemailer');
        } catch {
          log.warn('[notify] SMTP configurado pero "nodemailer" no está instalado (npm i nodemailer).');
          return;
        }
        const transport = nodemailer.createTransport({
          host: config.mail.host,
          port: config.mail.port,
          secure: config.mail.secure,
          auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
        });
        await transport.sendMail({
          from: config.mail.from,
          to: config.mail.to,
          replyTo: solicitud.email || undefined,
          subject: `${solicitud.servicio === 'emergencia' ? '⚠️ EMERGENCIA · ' : ''}Nueva solicitud ${solicitud.radicado} · ${solicitud.nombre}`,
          text: resumen(solicitud),
        });
      })(),
    );
  }

  if (config.webhookUrl) {
    tareas.push(
      fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: resumen(solicitud), solicitud }),
        signal: AbortSignal.timeout(8000),
      }).then((r) => {
        if (!r.ok) throw new Error(`Webhook respondió ${r.status}`);
      }),
    );
  }

  const resultados = await Promise.allSettled(tareas);
  for (const r of resultados) if (r.status === 'rejected') log.error('[notify]', r.reason?.message || r.reason);
}

module.exports = { notificar, resumen, ETIQUETAS };
