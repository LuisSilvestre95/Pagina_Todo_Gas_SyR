# TODO GAS SYR S.A.S. · Sitio web corporativo

Sitio web de **TODO GAS SYR S.A.S.** (NIT 901.126.243-3): diseño, construcción, instalación y mantenimiento de redes de **gas natural** y **GLP** en Boyacá, Cundinamarca, Bogotá D.C. y Antioquia.

Todo el contenido sale de la *Hoja de Vida Empresarial* (octubre de 2026). Las fotografías son las del registro de obra real de la empresa.

## Qué incluye

| Área | Detalle |
|---|---|
| **Página principal** (`public/index.html`) | Hero animado, cifras con contadores, entidades contratantes, quiénes somos, misión/visión/filosofía, valores, ficha empresarial, 4 líneas de servicio, segmentos de cliente, metodología en 5 pasos, proyectos con filtro y línea de tiempo, esquema interactivo de instalación domiciliaria, mapa de cobertura, HSEQ, galería con visor, guía de emergencia "¿Huele a gas?", preguntas frecuentes, formulario de cotización en 3 pasos |
| **Extras** | Modo claro/oscuro, estado "Abierto / Cerrado" en hora de Colombia, botón de WhatsApp con 2 líneas, barra de progreso, SEO (Schema.org, Open Graph, sitemap), PWA (manifest e íconos), impresión, accesibilidad (teclado, lectores de pantalla, `prefers-reduced-motion`) |
| **Backend** (`server/`) | Node.js **sin dependencias obligatorias**: servidor estático con compresión, caché y cabeceras de seguridad (CSP), API de solicitudes con validación, anti-spam y límite por IP, notificación por correo o webhook (opcionales) |
| **Panel** (`/admin.html`) | Lista de solicitudes, búsqueda, cambio de estado (nueva → contactada → cotizada → ganada/descartada) y exportación a CSV |
| **Legal** (`/privacidad.html`) | Política de tratamiento de datos (Ley 1581 de 2012) enlazada desde el formulario |

## Arranque rápido

```bash
cp .env.example .env       # y pon un ADMIN_TOKEN largo
npm start                  # http://localhost:3000
npm test                   # 16 pruebas del backend
```

Requisitos: Node.js 20 o superior. `npm install` solo es necesario si vas a enviar correos (instala `nodemailer`).

> **Sin servidor también funciona.** Si subes solo la carpeta `public/` a un hosting estático, el formulario detecta que no hay API y envía la solicitud por WhatsApp.

## Estructura

```
public/            Sitio (HTML, CSS, JS, imágenes, Leaflet local)
  index.html       Página principal
  css/styles.css   Sistema de diseño
  js/main.js       Interacciones
server/            Backend Node.js
  app.js           Rutas, seguridad y API
  lib/             Validación, almacenamiento, límite de envíos, notificaciones, estáticos
test/              Pruebas (node --test)
docs/              Arquitectura, despliegue y guía de contenido
```

## Documentación

- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md): cómo está construido y por qué.
- [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md): publicar en VPS, Docker, Render/Railway o hosting estático.
- [docs/CONTENIDO.md](docs/CONTENIDO.md): cambiar textos, fotos, cifras, municipios y colores de marca.
