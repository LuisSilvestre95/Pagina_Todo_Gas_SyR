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

## Fotos generadas con IA

Las fotos de `public/assets/img/ia/` (portada, tarjetas de servicios y franja final) son **imágenes ilustrativas generadas con IA** y la página las rotula como tales. La galería de "Registro fotográfico" usa solo fotos reales de obra.

- La lista de fotos y sus URL está en `scripts/fotos-ia.txt`. El flujo de GitHub Actions *Publicar en GitHub Pages* las descarga, las optimiza (JPG + WebP) y las guarda en el repositorio la primera vez que se ejecuta.
- Si una foto IA no existe, la página muestra automáticamente la foto real equivalente (atributo `data-fallback`).
- Para reemplazar una foto IA por una real, guarda tu foto con el mismo nombre (`hero-obra.jpg` y `hero-obra.webp`) y quita el rótulo "Imagen ilustrativa" de esa imagen en `index.html`.

## Hoja de vida empresarial descargable

`public/docs/Hoja_de_Vida_TODO_GAS_SYR.pdf` es una **versión pública** de la hoja de vida: el número de cédula, la firma y el sello del representante legal están tapados, y las páginas son imágenes, así que no queda texto oculto con esos datos. El documento firmado y los anexos se piden por WhatsApp.

## Mapa

Las coordenadas corresponden al casco urbano de cada municipio. El Marfil, Puerto Romero y Romerito pertenecen a Puerto Boyacá (así figuran en las resoluciones CREG 043 y 044 de 2021) y se muestran con un solo punto en el casco urbano de ese municipio.

## Páginas (vistas)

Cada `<section>` tiene `data-view="…"`: el menú muestra solo las secciones de esa vista. `inicio` agrupa portada, cifras y tarjetas de acceso; `*` (la franja final) aparece en todas menos en Contacto. Los títulos, descripciones y sub-pestañas de cada vista están en `VIEWS` y `SUBTABS` dentro de `js/main.js`. Para crear una vista nueva: agrega la sección con su `data-view`, una entrada en `VIEWS` y el enlace en el menú.
