# Reto 10 Matemático - I.E. República de Chile

Proyecto React + Vite para practicar cálculo mental, registrar puntajes y generar rankings.

## Cómo probar en la computadora

```bash
npm install
npm run dev
```

Abre el enlace que aparece, normalmente: `http://localhost:5173`

## Contraseña de Docente/Dirección

```
RCH2026
```

## Logo del colegio

El logo está en:

```
public/logo-republica-chile.png
```

Puedes reemplazarlo por otro archivo PNG con el mismo nombre.

## Cómo construir para publicar

```bash
npm run build
```

Se creará la carpeta `dist`.

## GitHub Pages

El archivo `.github/workflows/deploy.yml` ya está listo.

IMPORTANTE: Si cambias el nombre del repositorio, cambia también el `base` en `vite.config.ts`.

Ejemplo:

```ts
base: "/reto-10-matematico/",
```
