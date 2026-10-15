'use strict';

const TIPOS_CLIENTE = ['hogar', 'comercio', 'industria', 'otro'];
// Servicios que se cotizan desde el formulario web.
const SERVICIOS = ['gas-natural', 'mantenimiento', 'glp'];

const LIMITES = { nombre: 80, telefono: 20, email: 120, municipio: 80, empresa: 100, mensaje: 1500 };

/** Recorta, elimina caracteres de control y colapsa espacios. */
function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * Valida y normaliza una solicitud de contacto/cotización.
 * Devuelve { ok, data } o { ok: false, errors: { campo: mensaje } }.
 */
function validarSolicitud(body) {
  const errors = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: { _: 'Solicitud inválida.' } };
  }

  const data = {
    nombre: clean(body.nombre, LIMITES.nombre),
    telefono: clean(body.telefono, LIMITES.telefono),
    email: clean(body.email, LIMITES.email).toLowerCase(),
    empresa: clean(body.empresa, LIMITES.empresa),
    municipio: clean(body.municipio, LIMITES.municipio),
    tipoCliente: clean(body.tipoCliente, 30),
    servicio: clean(body.servicio, 30),
    mensaje: clean(body.mensaje, LIMITES.mensaje),
    aceptaPolitica: body.aceptaPolitica === true || body.aceptaPolitica === 'true' || body.aceptaPolitica === 'on',
  };

  if (data.nombre.length < 3) errors.nombre = 'Escribe tu nombre completo.';
  else if (!/^[\p{L}\p{M}' .-]+$/u.test(data.nombre)) errors.nombre = 'El nombre contiene caracteres no válidos.';

  const digitos = data.telefono.replace(/\D/g, '');
  if (digitos.length < 7 || digitos.length > 13 || !/^[+\d\s().-]+$/.test(data.telefono)) {
    errors.telefono = 'Escribe un teléfono válido (mínimo 7 dígitos).';
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
    errors.email = 'El correo electrónico no es válido.';
  }

  if (!TIPOS_CLIENTE.includes(data.tipoCliente)) errors.tipoCliente = 'Selecciona el tipo de cliente.';
  if (!SERVICIOS.includes(data.servicio)) errors.servicio = 'Selecciona el servicio que necesitas.';
  if (data.municipio.length < 2) errors.municipio = 'Indica el municipio o ciudad.';
  if (data.mensaje.length < 10) errors.mensaje = 'Cuéntanos un poco más (mínimo 10 caracteres).';
  if (!data.aceptaPolitica) errors.aceptaPolitica = 'Debes aceptar la política de tratamiento de datos.';

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

/** Señales de bot: campo trampa lleno o envío demasiado rápido. */
function pareceBot(body, now = Date.now()) {
  if (body && typeof body.website === 'string' && body.website.trim() !== '') return true;
  const iniciado = Number(body && body.startedAt);
  if (Number.isFinite(iniciado) && iniciado > 0 && now - iniciado < 2500) return true;
  return false;
}

module.exports = { validarSolicitud, pareceBot, TIPOS_CLIENTE, SERVICIOS, LIMITES };
