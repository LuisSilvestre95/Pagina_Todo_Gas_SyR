# Guía de contenido

Todo el contenido está en `public/index.html`, agrupado por secciones con comentarios `<!-- ============ NOMBRE ============ -->`.

## Cambios frecuentes

| Quiero cambiar… | Dónde |
|---|---|
| Teléfonos / WhatsApp | Busca `573209485534` y `573223618360` en `index.html`; en el servidor, `WHATSAPP_NUMBER` del `.env`; en JS, la constante `WHATSAPP` de `js/main.js` |
| Correo | Busca `todogassyr@hotmail.com` |
| Horario | Texto en la barra superior y en contacto; lógica en `HORARIO` de `js/main.js` (día de la semana → [hora de apertura, hora de cierre]) y en el JSON-LD del `<head>` |
| Cifras (23 años, 7 contratos…) | Sección `CIFRAS`: el atributo `data-to` es el valor animado y el texto interno es el que se ve sin JavaScript. Cambia ambos |
| Agregar un proyecto | Copia un `<article class="project">` en `PROYECTOS`. `data-type` = `gas-natural` o `glp`. La barra usa `--w` = metros del proyecto ÷ metros del proyecto más grande. Añade también una fila en la línea de tiempo (`--s` = año inicial, `--e` = año final + 1) |
| Agregar un municipio al mapa | En `COBERTURA`, agrega `<li><button data-lat="…" data-lng="…">Nombre</button></li>` en su departamento y actualiza el contador `dept__count`. Aparece solo en el mapa y en el autocompletado del formulario |
| Agregar fotos a la galería | Guarda la imagen en `public/assets/img/obra/` (JPG y WebP; ver abajo) y copia un `<button class="gallery__item">`. `gallery__item--wide` ocupa 2 columnas y `--tall` 2 filas |
| Colores de marca | Variables al inicio de `css/styles.css` (`--orange-500`, `--blue-500`, `--navy-900`, `--flame`…) |

## Imágenes

Las fotos actuales vienen del PDF y tienen baja resolución (máximo ~740 px). **Reemplazarlas por fotos originales de cámara mejora mucho el sitio.** Conserva los mismos nombres de archivo y genera las dos versiones:

```bash
convert foto.jpg -resize 1600x -strip -quality 82 nombre.webp
convert foto.jpg -resize 1600x -strip -interlace Plane -quality 84 nombre.jpg
```

Fotos que harían la diferencia: el equipo completo con dotación, la termofusión en primer plano, una planta de GLP y una obra terminada.

## Hoja de vida empresarial descargable

El botón de la ficha empresarial pide la hoja de vida por WhatsApp. No se publicó el PDF porque incluye la **firma** y la **cédula** del representante legal. Si quieres ofrecerlo como descarga directa, prepara una versión pública sin esos datos, guárdala en `public/docs/` y cambia el enlace del botón.
