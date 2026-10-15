/* =========================================================================
   TODO GAS SYR S.A.S. · Interacciones del sitio
   Sin dependencias (Leaflet es opcional y se usa solo si cargó).
   ========================================================================= */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WHATSAPP = '573209485534';

  const ETIQUETAS = {
    hogar: 'Hogar',
    comercio: 'Comercio',
    industria: 'Industria',
    constructora: 'Constructora',
    'empresa-servicios': 'Empresa de servicios públicos',
    'gas-natural': 'Redes de gas natural',
    glp: 'Sistemas de GLP',
    mantenimiento: 'Mantenimiento / reparación',
    'obra-civil': 'Obra civil',
    'revision-certificacion': 'Revisión / pruebas de hermeticidad',
    otro: 'Otro',
  };

  /* ---------- Utilidades ---------- */
  const formatMiles = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  function toast(message, type = 'ok') {
    const box = $('#toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = `toast${type === 'error' ? ' toast--error' : ''}`;
    el.innerHTML = `<svg class="i"><use href="#i-${type === 'error' ? 'alert' : 'check'}"/></svg><span></span>`;
    el.querySelector('span').textContent = message;
    box.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 5200);
  }

  function waUrl(text, numero = WHATSAPP) {
    return `https://wa.me/${numero}?text=${encodeURIComponent(text)}`;
  }

  /* ---------- Imágenes con respaldo (fotos IA → fotos reales de obra) ---------- */
  function useFallback(img) {
    const fb = img.dataset.fallback;
    if (!fb || img.dataset.fellBack) return;
    img.dataset.fellBack = '1';
    img.closest('picture')?.querySelectorAll('source').forEach((src) => src.remove());
    img.src = fb;
    const cap = img.dataset.fallbackCaption;
    const fig = img.closest('figure');
    if (cap && fig?.querySelector('figcaption')) fig.querySelector('figcaption').textContent = cap;
    fig?.querySelector('.service__badge')?.remove();
  }
  $$('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => useFallback(img));
    if (img.complete && img.naturalWidth === 0) useFallback(img);
  });

  /* ---------- Año ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Tema claro/oscuro ---------- */
  const themeBtn = $('#themeToggle');
  const themeListeners = [];
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  themeBtn?.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('tgs-theme', next); } catch { /* sin almacenamiento */ }
    themeListeners.forEach((fn) => fn(next));
  });

  /* ---------- Encabezado, progreso de scroll y "volver arriba" ---------- */
  const header = $('#header');
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');
  const ring = $('#toTopRing');
  if (header && $('.hero')) header.classList.add('is-top');
  toTop?.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, y / max) : 0;
    header?.classList.toggle('is-scrolled', y > 10);
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    toTop?.classList.toggle('is-visible', y > 700);
    if (ring) ring.style.strokeDashoffset = String(113.1 * (1 - ratio));
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  const navToggle = $('#navToggle');
  const nav = $('#nav');
  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    navToggle?.setAttribute('aria-expanded', String(open));
    navToggle?.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  navToggle?.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
  nav?.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', (e) => { if (e.matches) setNav(false); });

  /* ---------- Contadores animados ---------- */
  function animateCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const to = Number(el.dataset.to) || 0;
    const fmt = el.dataset.format === 'thousands' ? formatMiles : (n) => String(Math.round(n));
    if (reduceMotion) { el.textContent = fmt(to); return; }
    const dur = 1800;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(step);
  }

  /* ---------- Aparición al hacer scroll ---------- */
  $$('.bar--dots i').forEach((dot, i) => dot.style.setProperty('--n', i % 11));
  const revealEls = $$('.reveal, .counter, .timeline');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        if (el.classList.contains('counter')) animateCounter(el);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Pestañas accesibles (Misión/Visión, Segmentos) ---------- */
  $$('[data-tabs]').forEach((group) => {
    const tabs = $$('[role="tab"]', group);
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
  });

  /* ---------- Filtro de proyectos ---------- */
  const filterBtns = $$('[data-filter]');
  filterBtns.forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filterBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $$('.project').forEach((p) => {
      const show = f === 'todos' || p.dataset.type === f;
      p.classList.toggle('is-hidden', !show);
      if (show) { p.classList.add('is-visible'); $$('.counter', p).forEach(animateCounter); }
    });
  }));

  /* ---------- Recorrido de la instalación domiciliaria ---------- */
  const journey = $('#journey');
  if (journey) {
    const STEPS = {
      1: { title: 'Red de distribución', img: 'assets/img/obra/05-tendido-tuberia', alt: 'Tendido de tubería de polietileno en la zanja',
        text: 'La tubería de polietileno recorre calles y andenes. En GLP inicia en la planta de almacenamiento; en gas natural, en la red de la distribuidora. Va enterrada, señalizada y protegida.' },
      2: { title: 'Acometida', img: 'assets/img/hogar/proteccion-tuberia', alt: 'Técnicos protegiendo la tubería de gas en obra',
        text: 'Es el tramo que conecta la red de la calle con tu predio. Se construye con uniones por termofusión, cinta de señalización y protección mecánica de la tubería.' },
      3: { title: 'Centro de medición', img: 'assets/img/hogar/centro-medicion', alt: 'Centro de medición con regulador y medidor de gas',
        text: 'Aquí van el regulador y el medidor: controlan la presión del gas y registran tu consumo. Incluye la válvula de corte que permite cerrar el servicio en una emergencia.' },
      4: { title: 'Red interna', img: 'assets/img/hogar/red-interna', alt: 'Tubería interna con válvulas de paso',
        text: 'La tubería lleva el gas dentro de la vivienda hasta cada punto de conexión, con llaves de paso individuales. Se somete a prueba de hermeticidad antes de la puesta en servicio.' },
      5: { title: 'Gasodomésticos', img: 'assets/img/hogar/gasodomestico', alt: 'Estufa a gas encendida',
        text: 'Estufa, calentador y demás equipos se conectan con personal técnico certificado. Con la instalación aprobada, el gas queda listo para usar de forma segura.' },
    };
    const STEP1 = {
      gn: STEPS[1],
      glp: { title: 'Planta y red de distribución de GLP', img: 'assets/img/obra/05-tendido-tuberia', alt: 'Tendido de tubería de polietileno en la zanja',
        text: 'El GLP se almacena en tanques estacionarios en una planta y desde allí viaja por la red de polietileno enterrada bajo calles y andenes hasta cada predio. Así lo hicimos en Chivor, Pisba y municipios de Antioquia.' },
    };
    let sistema = 'gn';
    journey.dataset.sistema = sistema;
    $$('.journey__system button', journey).forEach((b) => b.addEventListener('click', () => {
      sistema = b.dataset.sistema;
      journey.dataset.sistema = sistema;
      $$('.journey__system button', journey).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      STEPS[1] = STEP1[sistema];
      go(1);
    }));
    const img = $('#journeyImg');
    const title = $('#journeyTitle');
    const text = $('#journeyText');
    const supportsWebp = document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
    let current = 1;

    const go = (n) => {
      current = ((n - 1 + 5) % 5) + 1;
      const s = STEPS[current];
      journey.dataset.step = current;
      $$('.seg, .hotspot', journey).forEach((g) => g.classList.toggle('is-active', Number(g.dataset.step) === current));
      $$('.journey__steps button', journey).forEach((b) => {
        const on = Number(b.dataset.step) === current;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      journey.classList.add('is-swapping');
      setTimeout(() => {
        img.src = `${s.img}.${supportsWebp ? 'webp' : 'jpg'}`;
        img.alt = s.alt;
        title.textContent = s.title;
        text.textContent = s.text;
        journey.classList.remove('is-swapping');
      }, reduceMotion ? 0 : 200);
    };

    journey.addEventListener('click', (e) => {
      const target = e.target.closest('.hotspot, .journey__steps button, [data-journey]');
      if (!target) return;
      if (target.dataset.journey) go(current + (target.dataset.journey === 'next' ? 1 : -1));
      else go(Number(target.dataset.step));
    });
    journey.addEventListener('keydown', (e) => {
      const hs = e.target.closest('.hotspot');
      if (hs && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(Number(hs.dataset.step)); }
    });
    go(1);
  }

  /* ---------- Anatomía de la zanja ---------- */
  const trench = $('#zanja');
  if (trench) {
    const setLayer = (n) => {
      trench.dataset.active = n || '';
      $$('[data-layer]', trench).forEach((el) => el.classList.toggle('is-active', el.dataset.layer === n));
    };
    $$('.trench__list li, .tlabel, .layer', trench).forEach((el) => {
      el.addEventListener('mouseenter', () => setLayer(el.dataset.layer));
      el.addEventListener('click', () => setLayer(el.dataset.layer));
    });
    trench.addEventListener('mouseleave', () => setLayer(''));
  }

  /* ---------- Mapa de cobertura (Leaflet) ---------- */
  const mapEl = $('#map');
  const townBtns = $$('#coverageList button[data-lat]');
  let map = null;
  const markers = new Map();

  function initMap() {
    if (map || !mapEl || !window.L) return;
    const L = window.L;
    mapEl.innerHTML = '';
    map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });

    const tileUrl = (theme) => `https://{s}.basemaps.cartocdn.com/${theme === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`;
    let tiles = L.tileLayer(tileUrl(currentTheme()), {
      maxZoom: 18,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);
    themeListeners.push((t) => tiles.setUrl(tileUrl(t)));

    const hq = townBtns.find((b) => b.textContent.trim().startsWith('Tunja'));
    const hqLatLng = hq ? [Number(hq.dataset.lat), Number(hq.dataset.lng)] : null;
    const bounds = [];

    townBtns.forEach((btn) => {
      const latlng = [Number(btn.dataset.lat), Number(btn.dataset.lng)];
      const name = btn.childNodes[0].textContent.trim();
      const dept = btn.closest('.dept')?.querySelector('.dept__name')?.textContent.trim() || '';
      const isHq = btn.hasAttribute('data-hq');
      const extra = btn.querySelector('em')?.textContent;
      const cls = `map-pin${isHq ? ' map-pin--hq' : ''}${dept === 'Antioquia' ? ' map-pin--antioquia' : ''}`;
      const icon = L.divIcon({ className: cls, html: '<span></span>', iconSize: [24, 24] });
      const marker = L.marker(latlng, { icon, title: name, keyboard: true, zIndexOffset: isHq ? 1000 : 0 })
        .addTo(map)
        .bindPopup(`<strong>${name}</strong><br>${dept}${extra ? ` · ${extra}` : ''}${btn.dataset.note ? `<br><small>${btn.dataset.note}. Ubicación de referencia del municipio.</small>` : ''}`);
      marker.bindTooltip(name, { direction: 'top', offset: [0, -10] });
      markers.set(btn, marker);
      bounds.push(latlng);
      if (hqLatLng && !isHq) {
        L.polyline([hqLatLng, latlng], { className: 'map-line', color: dept === 'Antioquia' ? '#f26b1d' : '#1491e0', weight: 2, opacity: 0.55, interactive: false }).addTo(map);
      }
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });
    map.on('focus click', () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());
  }

  townBtns.forEach((btn) => btn.addEventListener('click', () => {
    townBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
    if (!map) initMap();
    const marker = markers.get(btn);
    if (!map || !marker) return;
    map.flyTo(marker.getLatLng(), 11, { duration: reduceMotion ? 0 : 1.2 });
    marker.openPopup();
    if (window.innerWidth < 960) mapEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }));

  if (mapEl) {
    const tryInit = () => {
      if (window.L) return initMap();
      // Leaflet se carga con "defer"; si falló la red, mostramos un aviso útil.
      mapEl.querySelector('p').textContent = 'No fue posible cargar el mapa. Revisa la lista de municipios.';
    };
    if ('IntersectionObserver' in window) {
      const mio = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { mio.disconnect(); tryInit(); }
      }, { rootMargin: '300px' });
      mio.observe(mapEl);
    } else {
      window.addEventListener('load', tryInit);
    }
  }

  /* ---------- Galería + visor ---------- */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  const items = $$('#gallery .gallery__item');
  let lbIndex = 0;
  let lastFocus = null;

  function showLb(i) {
    lbIndex = (i + items.length) % items.length;
    const it = items[lbIndex];
    lbImg.src = it.dataset.full;
    lbImg.alt = it.querySelector('img')?.alt || '';
    lbCap.textContent = `${lbIndex + 1} / ${items.length} · ${it.querySelector('.gallery__cap')?.textContent.replace(/^\d+/, '').trim() || ''}`;
  }
  function openLb(i) {
    if (!lb) return;
    lastFocus = document.activeElement;
    showLb(i);
    if (typeof lb.showModal === 'function') lb.showModal();
    else lb.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    if (!lb) return;
    if (typeof lb.close === 'function' && lb.open) lb.close();
    else lb.removeAttribute('open');
  }
  lb?.addEventListener('close', () => { document.body.style.overflow = ''; lastFocus?.focus(); });
  items.forEach((it, i) => it.addEventListener('click', () => openLb(i)));
  lb?.addEventListener('click', (e) => {
    const action = e.target.closest('[data-lb]')?.dataset.lb;
    if (action === 'close') closeLb();
    else if (action === 'prev') showLb(lbIndex - 1);
    else if (action === 'next') showLb(lbIndex + 1);
    else if (e.target === lb) closeLb();
  });
  lb?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  });
  let touchX = null;
  lb?.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb?.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Estado abierto/cerrado (hora de Colombia) ---------- */
  const HORARIO = { 1: [8, 18], 2: [8, 18], 3: [8, 18], 4: [8, 18], 5: [8, 18], 6: [9, 13] };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const fmtHora = (h) => `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'p.m.' : 'a.m.'}`;

  function bogotaNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  function updateStatus() {
    const box = $('#openStatus');
    const small = $('#openStatusSmall');
    if (!box) return;
    const { day, minutes } = bogotaNow();
    const today = HORARIO[day];
    const open = today && minutes >= today[0] * 60 && minutes < today[1] * 60;
    let msg;
    if (open) {
      msg = `<strong>Abierto ahora</strong> · atendemos hasta las ${fmtHora(today[1])}`;
    } else {
      let d = day;
      let label = '';
      if (today && minutes < today[0] * 60) label = 'hoy';
      else {
        for (let k = 1; k <= 7; k++) {
          d = (day + k) % 7;
          if (HORARIO[d]) { label = k === 1 ? 'mañana' : `el ${DIAS[d]}`; break; }
        }
      }
      msg = `<strong>Cerrado</strong> · abrimos ${label} a las ${fmtHora(HORARIO[d][0])}`;
    }
    box.classList.toggle('is-open', Boolean(open));
    box.querySelector('.label').innerHTML = msg;
    if (small) {
      small.textContent = open ? '● Abierto ahora' : 'Horario de atención';
      small.classList.toggle('is-open', Boolean(open));
    }
  }
  updateStatus();
  setInterval(updateStatus, 60_000);

  /* ---------- Botón flotante de WhatsApp ---------- */
  const fabBtn = $('#fabBtn');
  const fabMenu = $('#fabMenu');
  fabBtn?.addEventListener('click', () => {
    const open = fabMenu.hidden;
    fabMenu.hidden = !open;
    fabBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (fabMenu && !fabMenu.hidden && !e.target.closest('#fab')) {
      fabMenu.hidden = true;
      fabBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Formulario de cotización por pasos ---------- */
  const form = $('#quoteForm');
  if (form) {
    const steps = $$('.quote__step', form);
    const btnPrev = $('[data-quote="prev"]', form);
    const btnNext = $('[data-quote="next"]', form);
    const btnSubmit = $('[data-quote="submit"]', form);
    const stepLabel = $('#stepLabel');
    const stepBar = $('#stepBar');
    const done = $('#quoteDone');
    const msg = $('#mensaje');
    const msgCount = $('#msgCount');
    const startedAt = Date.now();
    let step = 1;

    // Autocompletado de municipios desde la lista de cobertura.
    const dl = $('#municipios');
    if (dl) {
      const names = new Set(['Bogotá D.C.', 'El Marfil (Puerto Boyacá)', 'Puerto Romero (Puerto Boyacá)', 'Romerito (Puerto Boyacá)']);
      $$('#coverageList .towns li').forEach((li) => names.add((li.querySelector('button, span')?.childNodes[0].textContent || '').trim()));
      [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es')).forEach((n) => {
        const o = document.createElement('option');
        o.value = n;
        dl.appendChild(o);
      });
    }

    msg?.addEventListener('input', () => { msgCount.textContent = String(msg.value.length); });

    const setError = (name, text) => {
      const el = $(`[data-error="${name}"]`, form);
      if (el) el.textContent = text || '';
      const input = form.elements[name];
      const field = input && (input.closest?.('.field') || (input[0] && input[0].closest?.('.field')));
      field?.classList.toggle('has-error', Boolean(text));
    };

    const values = () => {
      const fd = new FormData(form);
      return {
        tipoCliente: fd.get('tipoCliente') || '',
        servicio: fd.get('servicio') || '',
        municipio: String(fd.get('municipio') || '').trim(),
        nombre: String(fd.get('nombre') || '').trim(),
        telefono: String(fd.get('telefono') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        empresa: String(fd.get('empresa') || '').trim(),
        mensaje: String(fd.get('mensaje') || '').trim(),
        aceptaPolitica: fd.get('aceptaPolitica') === 'on',
        website: String(fd.get('website') || ''),
        startedAt,
      };
    };

    const validators = {
      1: (v) => ({ tipoCliente: v.tipoCliente ? '' : 'Selecciona una opción para continuar.' }),
      2: (v) => ({
        servicio: v.servicio ? '' : 'Selecciona el servicio que necesitas.',
        municipio: v.municipio.length >= 2 ? '' : 'Indica el municipio o ciudad.',
      }),
      3: (v) => ({
        nombre: v.nombre.length >= 3 ? '' : 'Escribe tu nombre completo.',
        telefono: /^[+\d\s().-]{7,20}$/.test(v.telefono) && v.telefono.replace(/\D/g, '').length >= 7 ? '' : 'Escribe un teléfono válido (mínimo 7 dígitos).',
        email: !v.email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email) ? '' : 'El correo electrónico no es válido.',
        mensaje: v.mensaje.length >= 10 ? '' : 'Cuéntanos un poco más (mínimo 10 caracteres).',
        aceptaPolitica: v.aceptaPolitica ? '' : 'Debes aceptar la política de tratamiento de datos.',
      }),
    };

    const validate = (n) => {
      const errs = validators[n](values());
      let ok = true;
      Object.entries(errs).forEach(([k, t]) => { setError(k, t); if (t) ok = false; });
      if (!ok) {
        const first = Object.keys(errs).find((k) => errs[k]);
        const input = form.elements[first];
        (input?.focus ? input : input?.[0])?.focus();
      }
      return ok;
    };

    const show = (n) => {
      step = n;
      steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.step) === n));
      btnPrev.hidden = n === 1;
      btnNext.hidden = n === steps.length;
      btnSubmit.hidden = n !== steps.length;
      stepLabel.textContent = `Paso ${n} de ${steps.length}`;
      stepBar.style.width = `${(n / steps.length) * 100}%`;
    };

    btnNext.addEventListener('click', () => { if (validate(step)) show(step + 1); });
    btnPrev.addEventListener('click', () => show(step - 1));

    // Avanza solo al elegir una tarjeta en el paso 1.
    form.addEventListener('change', (e) => {
      if (e.target.name === 'tipoCliente') { setError('tipoCliente', ''); setTimeout(() => show(2), 220); }
      if (e.target.name === 'servicio') setError('servicio', '');
    });
    // Enter en un input no envía el formulario a medias.
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && step < steps.length) {
        e.preventDefault();
        btnNext.click();
      }
    });

    // Botones "Cotizar este servicio" y segmentos preseleccionan opciones.
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-servicio], [data-tipo]');
      if (!link) return;
      if (link.dataset.servicio) {
        const r = form.querySelector(`input[name="servicio"][value="${link.dataset.servicio}"]`);
        if (r) r.checked = true;
      }
      if (link.dataset.tipo) {
        const r = form.querySelector(`input[name="tipoCliente"][value="${link.dataset.tipo}"]`);
        if (r) { r.checked = true; show(2); }
      }
    });

    const resumen = (v) => [
      'Hola TODO GAS SYR, quiero solicitar una cotización:',
      `• Tipo de cliente: ${ETIQUETAS[v.tipoCliente] || v.tipoCliente}`,
      `• Servicio: ${ETIQUETAS[v.servicio] || v.servicio}`,
      `• Municipio: ${v.municipio}`,
      `• Nombre: ${v.nombre}`,
      v.empresa && `• Empresa: ${v.empresa}`,
      `• Teléfono: ${v.telefono}`,
      v.email && `• Correo: ${v.email}`,
      '',
      v.mensaje,
    ].filter((l) => l !== '' && l !== false).join('\n');

    const finish = (radicado, link) => {
      $('#radicado').textContent = radicado;
      $('#doneWhatsapp').href = link;
      form.hidden = true;
      done.hidden = false;
      done.focus();
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate(3)) return;
      const v = values();
      btnSubmit.classList.add('is-loading');
      btnSubmit.querySelector('.btn__label').textContent = 'Enviando…';

      try {
        // En GitHub Pages u otro hosting estático no hay API: se continúa por WhatsApp.
        if (/github\.io$/.test(location.hostname) || location.protocol === 'file:') throw new Error('sin backend');
        const res = await fetch('/api/contacto', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(v),
          signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined,
        });
        const data = await res.json().catch(() => null);

        if (res.ok && data?.ok) {
          finish(data.radicado, data.whatsappUrl || waUrl(resumen(v)));
          toast('¡Listo! Recibimos tu solicitud.');
          return;
        }
        if (res.status === 422 && data?.errors) {
          Object.entries(data.errors).forEach(([k, t]) => setError(k, t));
          const firstStep = data.errors.tipoCliente ? 1 : data.errors.servicio || data.errors.municipio ? 2 : 3;
          show(firstStep);
          toast(data.error || 'Revisa los campos marcados.', 'error');
          return;
        }
        if (res.status === 429) {
          toast(data?.error || 'Demasiados envíos seguidos. Intenta en unos minutos.', 'error');
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      } catch {
        // Sin backend disponible (hosting estático o sin conexión): continuamos por WhatsApp.
        finish('vía WhatsApp', waUrl(resumen(v)));
        toast('Tu solicitud está lista: envíala por WhatsApp con un toque.');
      } finally {
        btnSubmit.classList.remove('is-loading');
        btnSubmit.querySelector('.btn__label').textContent = 'Enviar solicitud';
      }
    });

    $('#quoteReset')?.addEventListener('click', () => {
      form.reset();
      msgCount.textContent = '0';
      done.hidden = true;
      form.hidden = false;
      show(1);
    });

    show(1);
  }


  /* ---------- Vistas: cada opción del menú abre su propia página ---------- */
  const VIEWS = [
    { id: 'inicio', name: 'Inicio' },
    { id: 'nosotros', name: 'Nosotros', title: 'Quiénes somos', lead: 'Empresa boyacense con 23 años en redes de gas natural y GLP.' },
    { id: 'servicios', name: 'Servicios', title: 'Servicios y metodología', lead: 'Redes de gas natural, sistemas de GLP, mantenimiento y obra civil, con un proceso técnico de 5 pasos.' },
    { id: 'proyectos', name: 'Proyectos', title: 'Proyectos y registro de obra', lead: 'Contratos ejecutados, metros construidos y fotografías reales de nuestros frentes de obra.' },
    { id: 'instalacion', name: 'Tu instalación', title: 'Tu instalación de gas', lead: 'Cómo llega el gas hasta tu cocina y qué hacer si huele a gas.' },
    { id: 'cobertura', name: 'Cobertura', title: 'Cobertura geográfica', lead: 'Boyacá, Cundinamarca, Bogotá D.C., Antioquia y proyectos a nivel nacional.' },
    { id: 'hseq', name: 'HSEQ', title: 'Sistema HSEQ', lead: 'Salud, seguridad, medio ambiente y calidad en cada obra.' },
    { id: 'contacto', name: 'Contacto', title: 'Contacto y cotizaciones', lead: 'Cuéntanos tu proyecto: te respondemos en horario de atención.' },
  ];
  const SUBTABS = {
    servicios: [['servicios', 'Líneas de servicio'], ['proceso', 'Metodología'], ['zanja', 'Anatomía de una zanja']],
    proyectos: [['proyectos', 'Experiencia'], ['galeria', 'Registro fotográfico']],
    instalacion: [['instalacion', 'Instalación domiciliaria'], ['seguridad', '¿Huele a gas?']],
    contacto: [['contacto', 'Formulario y datos'], ['faq', 'Preguntas frecuentes']],
  };
  const viewEls = $$('[data-view]');
  const pageHero = $('#pageHero');
  const pager = $('#pager');
  const baseTitle = document.title;
  let currentView = null;

  function resolve(hash) {
    const id = decodeURIComponent((hash || '').replace(/^#/, ''));
    if (!id) return { view: 'inicio', target: null };
    const el = document.getElementById(id);
    const holder = el?.closest('[data-view]');
    if (!holder || holder.dataset.view === '*') return el ? null : { view: 'inicio', target: null };
    return { view: holder.dataset.view, target: el };
  }

  function renderView(view, target, { focus = false, smooth = false } = {}) {
    const changed = view !== currentView;
    const info = VIEWS.find((v) => v.id === view) || VIEWS[0];
    if (changed) {
      currentView = view;
      document.body.dataset.view = view;
      viewEls.forEach((el) => {
        const v = el.dataset.view;
        el.hidden = v === '*' ? view === 'contacto' : v !== view;
      });
      const isHome = view === 'inicio';
      pageHero.hidden = isHome;
      if (!isHome) {
        $('#crumbCurrent').textContent = info.name;
        $('#pageTitle').textContent = info.title;
        $('#pageLead').textContent = info.lead;
        const tabs = SUBTABS[view] || [];
        $('#pageTabs').innerHTML = tabs.map(([id, label]) => `<a href="#${id}" class="page-hero__tab">${label}</a>`).join('');
        $$('.page-hero__tab').forEach((t) => (t.hidden = !document.getElementById(t.getAttribute('href').slice(1))));
      }
      document.title = isHome ? baseTitle : `${info.title} | TODO GAS SYR S.A.S.`;
      // Primera sección de la vista con menos espacio arriba
      viewEls.forEach((el) => el.classList.remove('is-first'));
      viewEls.find((el) => el.dataset.view === view)?.classList.add('is-first');
      // Menú: marcar la vista actual
      $$('.nav__list a').forEach((a) => {
        const on = a.getAttribute('href') === `#${view}`;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      // Paginador anterior / siguiente
      const i = VIEWS.findIndex((v) => v.id === view);
      const prev = VIEWS[i - 1];
      const next = VIEWS[i + 1];
      pager.hidden = isHome;
      pager.innerHTML = `${prev ? `<a href="#${prev.id}" class="pager__link pager__link--prev"><small>Anterior</small><strong>← ${prev.name}</strong></a>` : '<span></span>'}${next ? `<a href="#${next.id}" class="pager__link pager__link--next"><small>Siguiente</small><strong>${next.name} →</strong></a>` : ''}`;
      // Revelar lo que ya está en pantalla y ajustar el mapa
      requestAnimationFrame(() => {
        $$('.reveal:not(.is-visible)').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0 && !el.closest('[hidden]')) el.classList.add('is-visible');
        });
        if (map) map.invalidateSize();
      });
    }
    const first = viewEls.find((el) => el.dataset.view === view);
    const behavior = smooth && !reduceMotion ? 'smooth' : 'auto';
    if (target && target !== first && !(view === 'inicio' && target.id === 'inicio')) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior, block: 'start' }));
    } else {
      window.scrollTo({ top: 0, behavior: changed ? 'auto' : behavior });
    }
    if (focus && !pageHero.hidden) $('#pageTitle').focus({ preventScroll: true });
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const hash = a.getAttribute('href');
    if (hash === '#' || hash === '#main') return;
    const r = resolve(hash);
    if (!r) return;
    e.preventDefault();
    if (location.hash !== hash) history.pushState(null, '', hash);
    renderView(r.view, r.target, { focus: r.view !== currentView, smooth: true });
  });
  window.addEventListener('popstate', () => {
    const r = resolve(location.hash) || { view: 'inicio', target: null };
    renderView(r.view, r.target);
  });
  const initial = resolve(location.hash) || { view: 'inicio', target: null };
  renderView(initial.view, initial.target);
  // El navegador salta al ancla al terminar de cargar: se corrige la posición.
  const fixInitialScroll = () => {
    if (window.__tgsUserScrolled) return;
    const first = viewEls.find((el) => el.dataset.view === initial.view);
    if (!initial.target || initial.target === first) window.scrollTo(0, 0);
    else initial.target.scrollIntoView({ block: 'start' });
  };
  ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, () => { window.__tgsUserScrolled = true; }, { once: true, passive: true }));
  window.addEventListener('load', () => { fixInitialScroll(); setTimeout(fixInitialScroll, 60); setTimeout(fixInitialScroll, 350); });

  /* ---------- Efecto de profundidad en las fotos del hero ---------- */
  const visual = $('.hero__visual');
  if (visual && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    const photos = $$('.tilt', visual);
    visual.addEventListener('pointermove', (e) => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      photos.forEach((p, i) => {
        const depth = (i + 1) * 6;
        p.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translate3d(${x * depth}px, ${y * depth}px, 0)`;
      });
    });
    visual.addEventListener('pointerleave', () => photos.forEach((p) => { p.style.transform = ''; }));
  }

  /* ---------- Chispas / brasas animadas del hero ---------- */
  const canvas = $('#embers');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const COLORS = ['253,176,34', '242,107,29', '56,189,248'];
    let w = 0;
    let h = 0;
    let particles = [];
    let running = false;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, w / 18));
      particles = Array.from({ length: count }, () => spawn(true));
    };
    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 2.2 + 0.6,
      vy: Math.random() * 0.6 + 0.25,
      vx: (Math.random() - 0.5) * 0.3,
      life: Math.random() * 0.6 + 0.4,
      c: COLORS[Math.random() < 0.18 ? 2 : Math.random() < 0.55 ? 0 : 1],
      phase: Math.random() * Math.PI * 2,
    });
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y -= p.vy;
        p.phase += 0.02;
        p.x += p.vx + Math.sin(p.phase) * 0.25;
        const fade = Math.max(0, Math.min(1, p.y / h)) * p.life;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c},${fade})`;
        ctx.shadowColor = `rgba(${p.c},${fade})`;
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.y < -10) Object.assign(p, spawn(false));
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    resize();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    let inView = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        inView = e.isIntersecting;
        if (inView && !document.hidden) start(); else stop();
      }).observe(canvas);
    } else start();
    document.addEventListener('visibilitychange', () => (document.hidden || !inView ? stop() : start()));
  }
})();
