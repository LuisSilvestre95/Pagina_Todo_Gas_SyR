# Despliegue

## Opción A · VPS (recomendada, sitio completo con panel)

```bash
git clone <repo> todogas && cd todogas
cp .env.example .env          # define ADMIN_TOKEN, SITE_URL y, si quieres, SMTP_*
npm install --omit=dev        # solo si usarás correo
npm start
```

Mantenlo vivo con `pm2 start server/index.js --name todogas` o con un servicio systemd. Pon delante Nginx o Caddy con HTTPS y define `TRUST_PROXY=true` para que el límite por IP use la IP real.

Ejemplo con Caddy (HTTPS automático):

```
todogassyr.com, www.todogassyr.com {
  reverse_proxy 127.0.0.1:3000
}
```

## Opción B · Docker

```bash
docker build -t todogas .
docker run -d --name todogas -p 3000:3000 --env-file .env -v todogas-data:/app/data --restart unless-stopped todogas
```

El volumen `todogas-data` conserva las solicitudes entre actualizaciones.

## Opción C · Render / Railway / Fly.io

- Comando de inicio: `npm start`. Puerto: el de la variable `PORT` (lo asigna la plataforma).
- Variables: copia las de `.env.example`, con `TRUST_PROXY=true`.
- Monta un **disco persistente** en `/app/data` (o define `DATA_DIR`). Sin disco, las solicitudes se pierden en cada despliegue; en ese caso activa el correo o el webhook.

## Opción D · Solo estático (Netlify, Vercel, GitHub Pages, cPanel)

Publica únicamente la carpeta `public/`. El formulario detecta que no hay API y arma el mensaje para enviarlo por WhatsApp. El panel `/admin.html` no funcionará.

## Correo con Hotmail/Outlook

```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=todogassyr@hotmail.com
SMTP_PASS=<contraseña de aplicación>
```

Microsoft exige una **contraseña de aplicación** y que la cuenta tenga SMTP habilitado. Si prefieres no usar SMTP, un webhook a Make, Zapier o n8n puede reenviar al correo o a WhatsApp Business.

## Lista de verificación al publicar

- [ ] Dominio y HTTPS activos; actualizar `SITE_URL`, el `canonical`, `og:url` y `sitemap.xml` si el dominio no es `todogassyr.com`.
- [ ] `ADMIN_TOKEN` largo y aleatorio.
- [ ] Hacer una solicitud de prueba y verla en `/admin.html`.
- [ ] Registrar el sitio en Google Search Console y enviar el `sitemap.xml`.
- [ ] Crear o actualizar el **Perfil de Empresa en Google** (Tunja y Garagoa) con el enlace al sitio.
- [ ] Revisar con un asesor legal la política de datos en `privacidad.html`.
