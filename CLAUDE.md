# DealFlow Project

## Deployment

### Frontend (Cloudflare Workers)
- URL: https://dealflow.xenokev.workers.dev
- Deploy command: `cd frontend && CLOUDFLARE_API_TOKEN="8PKOUIlVtqzJodF9N8wH345BTFOrEreiDwH81M9s" npx wrangler deploy`
- Build before deploy: `npx opennextjs-cloudflare build`

### Backend (Render)
- URL: https://dealflow-api-tyz1.onrender.com
- Auto-deploys on `git push origin main`
- Admin account: admin@dealflow.com / Admin1234! (auto-seeded on startup)

## Tech Stack
- Backend: NestJS + TypeORM + SQLite (dev) / PostgreSQL (prod)
- Frontend: Next.js + OpenNext + Cloudflare Workers
- Global prefix: `/api`
