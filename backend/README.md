# Gestion Notes Universitaires Backend

Backend TypeScript avec Fastify + Prisma (SQLite), organise par features.

## Setup

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

## Endpoints utilises par le frontend

- `GET /api/health`
- `GET/POST/PUT/DELETE /api/students`
- `GET/POST/PUT/DELETE /api/teachers`
- `GET/POST/PUT/DELETE /api/modules`
- `GET/POST/DELETE /api/grades`
- `GET /api/trash`
- `POST /api/trash/restore`
- `DELETE /api/trash/:entity/:id`
- `DELETE /api/trash`
- `GET /api/stats/student/:studentId`
- `GET /api/reports/student/:studentId/pdf`
- `GET /api/reports/module/:moduleId/pdf`
