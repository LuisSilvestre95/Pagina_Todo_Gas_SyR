/* Panel de administración de solicitudes (requiere el backend con ADMIN_TOKEN). */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const ESTADOS = ['nueva', 'contactada', 'cotizada', 'ganada', 'descartada'];
  const ETIQUETAS = {
    hogar: 'Hogar', comercio: 'Comercio', industria: 'Industria', constructora: 'Constructora',
    'empresa-servicios': 'Empresa de servicios', 'gas-natural': 'Gas natural', glp: 'GLP',
    mantenimiento: 'Mantenimiento', 'obra-civil': 'Obra civil', 'revision-certificacion': 'Revisión / hermeticidad',
    emergencia: 'Emergencia', otro: 'Otro',
  };
  const KEY = 'tgs-admin-token';
  let token = '';
  let data = [];

  try { token = sessionStorage.getItem(KEY) || ''; } catch { /* sin almacenamiento */ }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fecha = (iso) => new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, { ...opts, headers: { authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
    if (res.status === 401) throw Object.assign(new Error('Token incorrecto.'), { auth: true });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Error ${res.status}`);
    }
    return res;
  }

  function render() {
    const q = $('#q').value.trim().toLowerCase();
    const fe = $('#fEstado').value;
    const rows = data.filter((s) =>
      (!fe || s.estado === fe) &&
      (!q || [s.nombre, s.municipio, s.telefono, s.email, s.empresa, s.radicado, s.mensaje].join(' ').toLowerCase().includes(q)));

    $('#kpis').innerHTML = ESTADOS.map((e) => `<div class="kpi"><strong>${data.filter((s) => s.estado === e).length}</strong><span>${e}s</span></div>`).join('');

    $('#rows').innerHTML = rows.map((s) => `
      <tr>
        <td><strong>${esc(s.radicado)}</strong><small>${esc(fecha(s.creada))}</small></td>
        <td><strong>${esc(s.nombre)}</strong><small>${esc(ETIQUETAS[s.tipoCliente] || s.tipoCliente)}${s.empresa ? ` · ${esc(s.empresa)}` : ''}</small><small>${esc(s.municipio)}</small></td>
        <td><a href="tel:${esc(s.telefono)}">${esc(s.telefono)}</a>${s.email ? `<small><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></small>` : ''}
          <small><a href="https://wa.me/57${esc(String(s.telefono).replace(/\D/g, '').replace(/^57(?=\d{10}$)/, ''))}" target="_blank" rel="noopener">WhatsApp ↗</a></small></td>
        <td>${esc(ETIQUETAS[s.servicio] || s.servicio)}</td>
        <td><div class="msg">${esc(s.mensaje)}</div></td>
        <td><select class="estado estado--${esc(s.estado)}" data-id="${esc(s.id)}" aria-label="Estado de ${esc(s.radicado)}">
          ${ESTADOS.map((e) => `<option value="${e}"${e === s.estado ? ' selected' : ''}>${e[0].toUpperCase() + e.slice(1)}</option>`).join('')}
        </select></td>
      </tr>`).join('');
    $('#empty').hidden = rows.length > 0;
  }

  async function load() {
    const res = await api('/api/admin/solicitudes');
    data = (await res.json()).solicitudes || [];
    render();
  }

  function showPanel(on) {
    $('#login').hidden = on;
    $('#panel').hidden = !on;
    $('#logout').hidden = !on;
  }

  async function start() {
    try {
      await load();
      showPanel(true);
    } catch (err) {
      showPanel(false);
      if (token) $('#loginError').textContent = err.message;
    }
  }

  $('#login').addEventListener('submit', (e) => {
    e.preventDefault();
    token = $('#token').value.trim();
    try { sessionStorage.setItem(KEY, token); } catch { /* sin almacenamiento */ }
    start();
  });

  $('#logout').addEventListener('click', () => {
    token = '';
    try { sessionStorage.removeItem(KEY); } catch { /* sin almacenamiento */ }
    data = [];
    showPanel(false);
  });

  $('#q').addEventListener('input', render);
  $('#fEstado').addEventListener('change', render);
  $('#refresh').addEventListener('click', () => load().then(() => toast('Actualizado')).catch((e) => toast(e.message)));

  $('#rows').addEventListener('change', async (e) => {
    const sel = e.target.closest('select[data-id]');
    if (!sel) return;
    try {
      await api(`/api/admin/solicitudes/${sel.dataset.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ estado: sel.value }),
      });
      const item = data.find((s) => s.id === sel.dataset.id);
      if (item) item.estado = sel.value;
      render();
      toast('Estado actualizado');
    } catch (err) {
      toast(err.message);
    }
  });

  $('#csv').addEventListener('click', async () => {
    try {
      const res = await api('/api/admin/solicitudes.csv');
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement('a'), { href: url, download: `solicitudes-todo-gas-${new Date().toISOString().slice(0, 10)}.csv` });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err.message);
    }
  });

  if (token) start();
})();
