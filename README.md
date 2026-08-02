# TrafficCop Pro v3.7.1 — Corrección del botón de Policía Administrativa

## Correcciones
- El botón **ADM · Policía administrativa** abre el módulo mediante tres mecanismos:
  1. evento normal de la aplicación;
  2. `onclick` directo;
  3. delegación global de eventos como respaldo.
- El módulo se fuerza a mostrarse aunque exista una regla CSS anterior que interfiera.
- `paOpen` y `paClose` quedan disponibles globalmente.
- Se limpia la caché de versiones anteriores.

## Diseño
- Seguridad Ciudadana: azul.
- Policía Administrativa: dorado/naranja.
- Atestados: morado.

## Archivos para GitHub
Subir todos los archivos del ZIP y sustituir los anteriores.
