# Vercel deployment findings

## Official sources

1. Vercel Express documentation: https://vercel.com/docs/frameworks/backend/express
   - An Express app on Vercel should be detected from a recognized entry file such as `app.ts`, `index.ts`, or `server.ts` and export the Express application as the default export, or use a port listener.
   - Static assets for an Express deployment should be placed in `public/**`; `express.static()` alone does not serve static assets on Vercel.
   - The Express application becomes a Vercel Function.

2. Vercel Vite documentation: https://vercel.com/docs/frameworks/frontend/vite
   - Vite builds optimized static assets for production.
   - For a Vite SPA, Vercel recommends a root `vercel.json` rewrite to `/index.html` for deep links when the app is deployed as static output.
   - Full-stack Vite applications need a supported function/server framework or a Vercel-compatible serverless setup.

3. Vercel Express guide: https://vercel.com/kb/guide/using-express-with-vercel
   - The guide uses a root `api/index.ts` entrypoint and a root `vercel.json` that routes requests to `/api`.
   - Production deployment should be verified separately from preview deployment.

## Observed production behavior

`https://jarida-live.vercel.app/` returned HTTP 200 with `content-type: application/javascript` and the body started with `// server/_core/index.ts`, proving Vercel served the bundled server JavaScript as the root document rather than the built HTML UI. The response also reported `x-vercel-cache: HIT`, but the primary defect is the wrong output/entrypoint configuration, not merely browser cache.
