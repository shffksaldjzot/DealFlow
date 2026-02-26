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

## Design
- 디자인 가이드라인: `DESIGN.md` 참고
- UI 작업 시 반드시 DESIGN.md의 컬러, 타이포, 여백, 컴포넌트 규격을 따를 것
