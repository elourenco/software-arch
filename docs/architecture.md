# Architecture

## 1. Resumo Executivo

A arquitetura usa Bun como runtime unico para API REST e UI React. O desafio MVC
fica concentrado em `src/api/modules`, agora com `user`, `product` e `order`
como dominios de negocio, e `auth` como modulo de suporte.

## 2. Analise Tecnica

Cada modulo API contem:

- `model`: tipos de dominio.
- `schema`: DTOs Zod para entrada/saida.
- `repository`: SQL e persistencia SQLite.
- `service`: regras de negocio.
- `controller`: boundary HTTP.
- `routes`: binding Elysia.
- `errors`: falhas de dominio mapeadas para HTTP.
- `mapper`: conversao entre row SQLite e modelo.

O fluxo principal de pedidos e:

```txt
React UI
  -> api-client.ts
  -> /api/orders
  -> order.routes.ts
  -> order.controller.ts
  -> order.service.ts
  -> order.repository.ts
  -> SQLite transaction
     - orders
     - order_items
     - products.quantity
```

`OrderService` concentra ownership, RBAC e transicoes de status. `OrderRepository`
executa transacoes curtas para debitar/devolver estoque. `ProductRepository`
mantem catalogo e estoque disponivel.

## 3. Implementacao

```txt
src/
  server.ts
  api/
    app.ts
    database/
      migrate.ts
      migrations/
        001_create_users.sql
        002_seed_admin_user.sql
        003_create_products_and_orders.sql
    modules/
      auth/
      user/
      product/
      order/
    shared/
  app/
    entrypoints/
    pages/
      admin/orders/
      orders/
      products/
      users/
    components/
    services/
      api-client.ts
      auth-session.ts
  routes/
```

Diagramas:

- C4 contexto: `docs/diagrams/c4-context.md` e
  `docs/diagrams/c4-context.mmd`.
- C4 container: `docs/diagrams/c4-container.md` e
  `docs/diagrams/c4-container.mmd`.
- MVC por modulo: `docs/diagrams/mvc-modules.md` e
  `docs/diagrams/mvc-modules.mmd`.
- Draw.io: `docs/diagrams/drawio/*.drawio`.
- Exports renderizados: `docs/diagrams/exports/*.svg` e `docs/diagrams/exports/*.png`.

## 4. Trade-offs

Feature modules adicionam mais arquivos, mas reduzem acoplamento e deixam o MVC
demonstravel por dominio. O runtime unico simplifica a entrega, mas exige
cuidado para a UI nao conter regra de negocio.

SQLite simplifica deploy e deixa SQL visivel. O custo e escrita single-writer,
principalmente em criacao/cancelamento de pedidos. As transacoes sao curtas para
reduzir lock time.

## 5. Quando usar vs evitar

Use quando o projeto precisa demonstrar arquitetura MVC, REST, OpenAPI,
persistencia e UI operacional em um unico executavel. Evite quando backend e
frontend exigirem deploy independente, alta escrita concorrente ou auditoria de
estoque completa.

## 6. Escalabilidade

O gargalo esperado e escrita SQLite, nao Elysia. WAL, `busy_timeout`, prepared
statements e services stateless mantem baixa latencia no escopo do desafio.

Evolucao incremental recomendada:

1. Adicionar paginacao, ordenacao explicita e limite maximo em listas.
2. Trocar busca por nome baseada em `LIKE` por FTS quando o volume justificar.
3. Medir latencia por rota e tempo de query no repository antes de trocar banco.
4. Migrar repositories para Postgres em alta concorrencia de escrita, mantendo
   controller, service e schemas estaveis.
5. Introduzir ledger de estoque apenas se auditoria/conciliacao exigir.
