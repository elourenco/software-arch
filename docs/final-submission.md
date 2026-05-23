# Final Submission Checklist

## 1. Resumo Executivo

Este documento mapeia o enunciado do desafio final para evidencias concretas do
projeto. A entrega implementa uma API REST MVC para uma empresa de vendas
on-line, com `User`, `Product` e `Order`, UI React, SQLite, OpenAPI, diagramas,
testes e binario compilavel.

Veredito: os requisitos obrigatorios do enunciado estao cobertos. O projeto
tambem entrega diferenciais praticos: persistencia real, auth JWT, estoque
transacional, dashboards por role e interface operacional.

## 2. Analise Tecnica

| Requisito do enunciado | Status | Evidencia |
| --- | --- | --- |
| API REST em plataforma e linguagem de escolha | Atendido | `package.json`, `src/server.ts`, `src/api/app.ts` |
| Padrao arquitetural MVC | Atendido | `src/api/modules/*`, `docs/architecture.md`, `docs/diagrams/mvc-modules.mmd` |
| Dominio para empresa de vendas on-line | Atendido | `User`, `Product`, `Order` |
| Create | Atendido | `POST /api/users`, `POST /api/products`, `POST /api/orders` |
| Read / Find All | Atendido | `GET /api/users`, `GET /api/products`, `GET /api/orders`, `GET /api/admin/orders` |
| Find By ID | Atendido | `GET /api/users/:id`, `GET /api/products/:id`, `GET /api/orders/:id` |
| Find By Name | Atendido | `GET /api/users/search?name=` |
| Update | Atendido | `PUT /api/users/:id`, `PUT /api/products/:id`, `PATCH /api/admin/orders/:id/status` |
| Delete / Cancel | Atendido | `DELETE /api/users/:id`, `DELETE /api/products/:id`, `PATCH /api/orders/:id/cancel` |
| Count | Atendido | `GET /api/users/count`, `GET /api/products/count`, `GET /api/admin/orders/count` |
| Model | Atendido | `*.model.ts` por modulo |
| Controller | Atendido | `*.controller.ts` por modulo |
| Service | Atendido | `*.service.ts` por modulo |
| Repository | Atendido | `*.repository.ts` por modulo |
| Estrutura de pastas explicada | Atendido | `README.md`, `docs/architecture.md`, `AGENTS.md` |
| Desenho arquitetural C4/UML/outro | Atendido | `docs/diagrams/*.md`, `docs/diagrams/*.mmd`, `docs/diagrams/drawio/*.drawio`, `docs/diagrams/exports/*` |
| OpenAPI / documentacao de API | Atendido | `/api/openapi`, `/api/openapi/json`, `docs/api.md` |
| Codigo funcionando | Atendido | `bun test`, `bun run typecheck`, `bun run build` |
| Persistencia funcionando | Atendido | SQLite via `bun:sqlite`, migrations em `src/api/database/migrate.ts` |

## 3. Implementacao

Fluxo minimo para avaliacao local:

```bash
bun install
bun run dev
```

URLs:

- UI: `http://localhost:3000`
- Health: `http://localhost:3000/api/health`
- OpenAPI UI: `http://localhost:3000/api/openapi`
- OpenAPI JSON: `http://localhost:3000/api/openapi/json`

Credencial administrativa criada por migration:

```txt
email: super@admin.app
password: 123456
role: admin
```

Depois do login, use `Authorization: Bearer <accessToken>` para:

- gerenciar usuarios em `/api/users`;
- gerenciar produtos em `/api/products` como admin;
- criar/listar/cancelar pedidos proprios em `/api/orders`;
- listar pedidos e atualizar status em `/api/admin/orders` como admin;
- consultar metricas em `/api/admin/dashboard` como admin.

Validacao tecnica:

```bash
bun run typecheck
bun test
bun run build
PORT=3131 DATABASE_URL=/tmp/software-arch.db ./dist/software-arch
curl http://localhost:3131/api/health
```

## 4. Trade-offs

O enunciado fala em disponibilizar dados para parceiros. Neste projeto, as rotas
de negocio sao publicadas como contrato REST/OpenAPI, mas protegidas por JWT.
Isso e mais realista para API de parceiros: reduz vazamento, preserva auditoria
e evita dados anonimos.

SQLite foi escolhido por simplicidade operacional e baixa latencia local. O
trade-off e escrita single-writer, mitigada por WAL, `busy_timeout`, prepared
statements e transacoes curtas de pedido/estoque.

`OrderItem` guarda snapshot de produto. Isso duplica SKU/nome, mas preserva
historico de pedido quando o catalogo muda.

## 5. Quando usar vs evitar

Use esta entrega para demonstrar:

- API REST MVC com responsabilidades isoladas.
- Catalogo, estoque e pedidos basicos de venda on-line.
- Dashboards separados para usuario e admin.
- Persistencia simples e verificavel.
- Documentacao de contrato via OpenAPI.
- Diagramas C4/MVC e estrutura de pastas explicada.
- Deploy local compacto com binario compilado.

Evite expandir para pagamento, fiscal, reserva de estoque ou auditoria completa
sem novo desenho de dominio.

## 6. Escalabilidade

O primeiro gargalo provavel e escrita no SQLite, especialmente criacao e
cancelamento de pedidos. Para crescimento incremental:

1. Adicionar paginacao e ordenacao explicita em listas.
2. Trocar busca `LIKE` por FTS ou indice especializado quando volume crescer.
3. Adicionar logs estruturados, request id e metricas por rota.
4. Migrar repositories para Postgres se houver alta concorrencia de escrita.
5. Introduzir ledger de estoque apenas se auditoria/conciliacao exigir.
