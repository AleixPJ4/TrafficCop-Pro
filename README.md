# TrafficCop Pro CAT 0.2

Aplicación PWA instalable en iPhone y Android.

## Ya funciona
- Buscador instantáneo y por voz.
- Filtros por norma, puntos y estado jurídico.
- Favoritos y recientes.
- Modo oscuro.
- Copiar y compartir.
- Uso offline.
- Importación y exportación de bases JSON.
- Instalación como app desde Safari o Chrome.

## Probar en ordenador
Dentro de esta carpeta:

    python -m http.server 8000

Abre `http://localhost:8000`.

## Instalar en móvil
La carpeta debe publicarse bajo HTTPS.

- iPhone: Safari → Compartir → Añadir a pantalla de inicio.
- Android: Chrome → menú → Instalar aplicación.

## Advertencia
La base incluida es DEMO. La interfaz es utilizable, pero no debe emplearse para formular denuncias hasta cargar una base oficial revisada.

## Base de datos
Usa `data/plantilla_schema.json` como referencia. Desde Herramientas puedes importar un JSON sin recompilar la aplicación.
