# Arquitectura

## Principios

1. **Rápido y liviano.** HTML, CSS y JavaScript sin frameworks ni compilación. Las imágenes van en WebP con respaldo JPG y carga diferida. El único recurso externo son las fuentes de Google (Sora + Inter) y los mosaicos del mapa.
2. **Funciona siempre.** Sin JavaScript se ve todo el contenido. Si Leaflet o el mapa fallan, queda la lista de municipios. Si no hay backend, el formulario continúa por WhatsApp.
3. **Contenido verídico.** Cifras, proyectos, contratantes y textos salen de la hoja de vida empresarial. No hay testimonios ni certificaciones inventadas.
4. **Seguro por defecto.** CSP sin scripts inline, validación en el servidor, campo trampa contra bots, límite por IP, comparación del token en tiempo constante y CSV protegido contra inyección de fórmulas.

## Frontend

| Archivo | Rol |
|---|---|
| `js/theme.js` | Se carga en `<head>`: aplica el tema guardado antes de pintar y marca `html.js` |
| `js/main.js` | Menú, scrollspy, animaciones al hacer scroll, contadores, pestañas, filtro, recorrido de la instalación, mapa, galería, estado de horario, formulario y chispas del hero |
| `css/styles.css` | Variables de diseño (`:root` y `[data-theme="dark"]`), componentes y responsive (puntos de corte: 1100, 960, 760, 600, 480 px) |
| `vendor/leaflet/` | Leaflet 1.9.4 alojado localmente (licencia BSD-2) |

**Marca:** azul noche `#0B1F33`, azul llama `#1491E0`, naranja `#F26B1D` y ámbar `#FDB022`. El degradado `--flame` reproduce la llama del logo.

## Backend

```
petición → app.js ─┬─ /api/health                     estado del servicio
                   ├─ POST /api/contacto              validar → guardar → notificar
                   ├─ /api/admin/*  (Bearer token)    listar, cambiar estado, CSV
                   └─ resto → lib/static.js           archivos de public/ (o 404.html)
```

- **Almacenamiento:** `data/solicitudes.json`. Las escrituras van en cola y son atómicas (archivo temporal + `rename`). Alcanza para miles de solicitudes; si el volumen crece, `lib/store.js` es el único archivo que cambiaría para pasar a SQLite o Postgres.
- **Radicado:** `TGS-AAAA-NNNN`, se le muestra al cliente y llega en el mensaje de WhatsApp.
- **Notificaciones:** correo SMTP (si existe `SMTP_HOST` y `nodemailer` está instalado) y/o webhook JSON (`WEBHOOK_URL`). Un fallo en la notificación no pierde la solicitud.
- **Anti-spam:** campo oculto `website` y tiempo mínimo de 2,5 s. Al bot se le responde "éxito" sin guardar nada.

## Pruebas

`npm test` ejecuta 16 pruebas con `node:test`: estáticos, 404, path traversal, cabeceras de seguridad, validación, anti-bot, límite por IP, panel admin y CSV.
