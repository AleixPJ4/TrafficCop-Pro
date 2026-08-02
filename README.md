# TrafficCop Pro v5.0.0 — Arquitectura limpia

## Qué cambia
La plataforma se ha dividido en módulos independientes cargados dentro de una aplicación principal:

- Inicio
- Tráfico
- Atestados
- LO 4/2015 Seguridad Ciudadana
- Policía Administrativa
- Catálogo de armas
- Documentación

Cada módulo funciona de forma aislada, por lo que su CSS y JavaScript no pueden alterar los márgenes o botones del resto.

## Estructura
- `index.html`: aplicación principal
- `assets/app.css`: diseño global
- `assets/app.js`: navegación global
- `modules/traffic.html`
- `modules/atestados.html`
- `modules/seguridad.html`
- `modules/administrativa.html`
- `docs/`: PDF integrados

## Instalación en GitHub
Se recomienda limpiar el repositorio o crear una rama nueva y subir exactamente esta estructura.
