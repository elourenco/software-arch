# Software Arch API

## 1. Resumo Executivo

Aplicacao fullstack em Bun com API REST Elysia, React UI, Zod, SQLite nativo (`bun:sqlite`), OpenAPI e build executavel com bytecode. O dominio principal e `User`, cobrindo CRUD, count, find all, find by ID e find by name.

Entregaveis principais do desafio:

- Checklist final: `docs/final-submission.md`.
- Arquitetura: `docs/architecture.md`.
- API: `docs/api.md`.
- Implantacao local/binario: `docs/deployment.md`.
- Diagramas fonte: `docs/diagrams/*.mmd` e `docs/diagrams/drawio/*.drawio`.
- Diagramas renderizados: `docs/diagrams/exports/*.svg` e `docs/diagrams/exports/*.png`.

## 2. Analise Tecnica

O backend vive em `src/api` e segue MVC por modulo. A UI vive em `src/app` e consome somente `/api` via `src/app/services/api-client.ts`. `src/server.ts` compoe API e UI como entrypoint unico para `bun build --compile --bytecode`.

## 3. Implementacao

```bash
bun install
bun run dev
bun test
bun run typecheck
bun run build
./dist/software-arch
```

URLs locais:

- UI: `http://localhost:3000`
- Health: `http://localhost:3000/api/health`
- OpenAPI: `http://localhost:3000/api/openapi`

Fluxo de API:

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. Usar `Authorization: Bearer <token>`
4. Testar `/api/users`, `/api/users/count`, `/api/users/search?name=`

Credencial administrativa inicial:

```txt
email: super@admin.app
password: 123456
```

Execucao do binario em porta isolada:

```bash
PORT=3131 DATABASE_URL=/tmp/software-arch.db ./dist/software-arch
curl http://localhost:3131/api/health
```

## 4. Trade-offs

SQLite nativo reduz dependencias e deixa SQL visivel, mas mantem limite de single-writer. JWT simples e stateless, mas nao oferece revogacao imediata. MVC por modulo e mais verboso que MVC global, mas mantem coesao por feature.

## 5. Quando usar vs evitar

Use para APIs pequenas/medias, desafios arquiteturais, ferramentas internas e produtos que precisam de entrega fullstack compacta. Evite para escrita altamente concorrente, multi-instancia com banco local compartilhado ou UI que precise deploy independente.

## 6. Escalabilidade

Controllers ficam finos, services stateless e repositories isolados. O repository pode migrar para Postgres sem reescrever controllers/UI. Arquivos miram cerca de 50 linhas, com JSDoc em contratos publicos para manter manutencao previsivel.
