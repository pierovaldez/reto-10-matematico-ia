# IA segura con OpenAI

Esta version incluye un backend seguro en:

```txt
api/generar-ejercicio.ts
```

La clave de OpenAI NO va dentro de `src/App.tsx` ni en el frontend.

## 1. Instalar dependencias

```powershell
pnpm install
```

## 2. Crear archivo .env.local

Copia `.env.example` y renombralo como `.env.local`.

Dentro coloca:

```txt
OPENAI_API_KEY=coloca_tu_clave_openai_aqui
```

## 3. Ejecutar con IA localmente

Para que funcione `/api/generar-ejercicio`, ejecuta:

```powershell
pnpm dev:ia
```

Abre el enlace local que muestre Vercel.

## 4. Publicar con IA

Para publicar con IA, usa Vercel y configura la variable de entorno:

```txt
OPENAI_API_KEY
```

Si publicas en GitHub Pages o Tiiny Host, la app funciona, pero la IA no funcionara porque esos servicios no ejecutan backend.
