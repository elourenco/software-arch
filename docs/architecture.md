# Architecture

## 1. Resumo Executivo

A arquitetura usa Bun como runtime unico para API REST e UI React. O desafio MVC fica concentrado em `src/api/modules`, com `user` como dominio principal e `auth` como modulo de suporte.

## 2. Analise Tecnica

Cada modulo API contem:

- `model`: tipos de dominio.
- `schema`: DTOs Zod para entrada/saida.
- `repository`: SQL e persistencia SQLite.
- `service`: regras de negocio.
- `controller`: boundary HTTP.
- `routes`: binding Elysia.

## 3. Implementacao

```txt
src/
  server.ts
  api/
    app.ts
    database/
    modules/auth/
    modules/user/
    shared/
  app/
    entrypoints/
    pages/
    components/
    services/
  routes/
```

## 4. Trade-offs

Feature modules adicionam mais arquivos, mas reduzem acoplamento e deixam o MVC demonstravel por dominio. O runtime unico simplifica a entrega, mas exige cuidado para a UI nao conter regra de negocio.

## 5. Quando usar vs evitar

Use quando o projeto precisa demonstrar arquitetura e ainda entregar software executavel. Evite quando backend e frontend exigirem ciclos de deploy e escalabilidade independentes.

## 6. Escalabilidade

O gargalo esperado e escrita SQLite, nao Elysia. WAL, prepared statements e services stateless mantem baixa latencia no escopo do desafio.
