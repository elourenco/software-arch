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

Diagramas:

- C4 contexto: `docs/diagrams/c4-context.mmd`.
- C4 container: `docs/diagrams/c4-container.mmd`.
- MVC por modulo: `docs/diagrams/mvc-modules.mmd`.
- Draw.io: `docs/diagrams/drawio/*.drawio`.
- Exports renderizados: `docs/diagrams/exports/*.svg` e `docs/diagrams/exports/*.png`.

## 4. Trade-offs

Feature modules adicionam mais arquivos, mas reduzem acoplamento e deixam o MVC demonstravel por dominio. O runtime unico simplifica a entrega, mas exige cuidado para a UI nao conter regra de negocio.

JWT protege os dados do dominio mesmo com API publicada para parceiros. A alternativa anonima seria mais simples para demonstracao, mas pior para confidencialidade, auditoria e evolucao para credenciais por parceiro.

## 5. Quando usar vs evitar

Use quando o projeto precisa demonstrar arquitetura e ainda entregar software executavel. Evite quando backend e frontend exigirem ciclos de deploy e escalabilidade independentes.

## 6. Escalabilidade

O gargalo esperado e escrita SQLite, nao Elysia. WAL, prepared statements e services stateless mantem baixa latencia no escopo do desafio.

Evolucao incremental recomendada:

1. Adicionar paginacao, ordenacao explicita e limite maximo em `GET /api/users`.
2. Trocar busca por nome baseada em `LIKE` por FTS quando o volume justificar.
3. Medir latencia por rota e tempo de query no repository antes de trocar banco.
4. Migrar o repository para Postgres em alta concorrencia de escrita, mantendo controller, service e schemas estaveis.
