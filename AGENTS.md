# AGENTS.md

Contrato operacional para agentes trabalhando neste repositorio.

## 1. Resumo Executivo

Este projeto implementa o desafio final de Arquitetura de Software: projetar, documentar e implantar uma API REST no padrao MVC que disponibilize dados de um dominio para parceiros de uma empresa de vendas on-line.

O dominio implementado e `User`. A stack real do repositorio e:

- Runtime e build: Bun.
- API: Elysia REST, OpenAPI em `/api/openapi`, schemas Zod.
- UI: React servida pelo mesmo `Bun.serve`, consumindo apenas `/api`.
- Persistencia: SQLite via `bun:sqlite`, migrations SQL e WAL fora de `:memory:`.
- Testes: `bun:test` com banco migrado em memoria.

Responda e implemente como Principal Software Engineer / Software Architect: direto, tecnico, sem explicacoes basicas, com foco em decisao pratica, latencia, throughput, resiliencia e manutencao.

## 2. Analise Tecnica

Ao responder qualquer pergunta tecnica neste repo, estruture a resposta sempre assim:

1. Resumo Executivo
2. Analise Tecnica
3. Implementacao (codigo ou arquitetura real)
4. Trade-offs
5. Quando usar vs evitar
6. Escalabilidade

Se faltar contexto, faca perguntas objetivas antes de responder. Nao chute contrato, endpoint, comportamento de biblioteca ou requisito do desafio quando isso puder ser verificado no projeto.

Prioridades obrigatorias em qualquer analise:

- Performance e latencia: caminho quente, alocacoes, I/O, queries, serializacao, custo de renderizacao e tamanho de payload.
- Concorrencia e throughput: single-writer do SQLite, `busy_timeout`, stateless services, idempotencia quando aplicavel e limites do runtime unico.
- Falhas e resiliencia: validacao de entrada, erros de dominio, falha de persistencia, auth invalida, degradacao e observabilidade minima.
- Trade-offs explicitos: simplicidade vs escalabilidade, runtime unico vs deploy independente, SQLite vs banco cliente-servidor, JWT stateless vs revogacao.

## 3. Implementacao

Comandos reais do projeto:

```bash
bun install
bun run dev
bun test
bun run typecheck
bun run build
bun run start:binary
```

URLs locais esperadas:

- UI: `http://localhost:3000`
- Health: `http://localhost:3000/api/health`
- OpenAPI: `http://localhost:3000/api/openapi`

Mapa de arquitetura do checkout:

```txt
src/
  server.ts                    # Bun.serve, rotas frontend e delegacao /api
  routes/
    api-router.ts              # boundary entre Bun.serve e Elysia
    frontend-router.ts         # HTML routes e fallback da UI
  api/
    app.ts                     # composicao da API, OpenAPI, controllers/services/repositories
    config/env.ts              # variaveis runtime
    database/                  # SQLite, pragmas e migrations
    modules/
      auth/                    # registro, login, me, JWT
      user/                    # dominio principal do desafio
    shared/                    # erros, auth guard, security helpers
  app/
    entrypoints/               # HTML e bootstrap React
    pages/                     # UI por rota
    components/                # componentes reutilizaveis
    services/api-client.ts     # unico boundary HTTP da UI
tests/
  helpers/test-db.ts           # banco migrado em memoria
  http/                        # testes de rotas
  modules/                     # testes de service/repository
docs/
  architecture.md
  api.md
  diagrams/*.mmd
```

Contrato do desafio ja coberto pelo projeto:

- CRUD completo de `User`.
- `GET /api/users/count`.
- `GET /api/users`.
- `GET /api/users/:id`.
- `GET /api/users/search?name=`.
- Persistencia SQLite como diferencial.
- Documentacao OpenAPI.
- Diagramas C4/MVC em Mermaid.
- Explicacao da estrutura em `README.md` e `docs/architecture.md`.

Ao adicionar ou alterar um dominio, preserve o MVC por modulo:

```txt
src/api/modules/<domain>/
  <domain>.model.ts
  <domain>.schema.ts
  <domain>.repository.ts
  <domain>.service.ts
  <domain>.controller.ts
  <domain>.routes.ts
  <domain>.errors.ts
  <domain>.mapper.ts
```

Regras de codigo:

- Nunca use pseudo-codigo. Edite codigo real, tipado e executavel.
- Prefira mudancas pequenas, localizadas e alinhadas ao padrao existente.
- Controllers devem ser finos e delegar regra de negocio para services.
- Services devem ser stateless e concentrar regras de negocio.
- Repositories devem isolar SQL, usar prepared statements e converter erros de persistencia para erros de dominio quando fizer sentido.
- Schemas Zod sao o boundary de entrada/saida. Nao duplique validacao ad hoc em controllers.
- Nunca exponha `passwordHash` ou dado sensivel em resposta publica.
- UI React deve consumir dados somente por `src/app/services/api-client.ts`; nao coloque regra de negocio do backend na UI.
- Ao mudar contrato de API, atualize rotas, schemas, testes, OpenAPI implicito, `docs/api.md` e telas consumidoras.
- Ao mudar arquitetura, atualize `README.md`, `docs/architecture.md` e `docs/diagrams/*` no mesmo changeset.
- Nao introduza framework pesado, ORM, fila, cache distribuido, service mesh ou microservico sem justificativa arquitetural concreta.

## 4. Trade-offs

Trade-offs assumidos no projeto:

- Bun + Elysia reduz boilerplate e melhora entrega fullstack compacta, mas reduz portabilidade para runtimes Node tradicionais.
- Runtime unico simplifica deploy e observabilidade local, mas acopla ciclo de release da UI e API.
- SQLite reduz dependencias, deixa SQL visivel e facilita avaliacao do desafio, mas tem limite natural de escrita concorrente e operacao multi-instancia.
- JWT stateless reduz I/O por request, mas nao oferece revogacao imediata sem denylist ou refresh-token flow.
- MVC por feature module aumenta quantidade de arquivos, mas melhora coesao por dominio e deixa o desafio arquitetural explicito.

Ao propor mudancas, compare contra esses trade-offs. Nao troque a arquitetura por preferencia pessoal.

## 5. Quando usar vs evitar

Use o desenho atual quando:

- O objetivo e demonstrar arquitetura MVC, API REST, documentacao e persistencia simples.
- O produto e pequeno/medio, ferramenta interna, desafio academico ou API de parceiro com baixa concorrencia de escrita.
- A prioridade e latencia baixa, deploy simples e codigo facil de avaliar.

Evite ou reavalie o desenho atual quando:

- Houver necessidade real de multiplas instancias escrevendo no mesmo banco.
- A UI precisar deploy independente da API.
- O dominio exigir transacoes complexas, alta concorrencia de escrita, auditoria forte ou historico temporal.
- Requisitos de auth exigirem revogacao imediata, refresh tokens, RBAC granular ou integracao corporativa.

Nesse caso, proponha migracao incremental: manter controllers/services e trocar primeiro o repository/persistencia antes de redesenhar toda a aplicacao.

## 6. Escalabilidade

Escalabilidade esperada para evolucao do projeto:

- Primeiro gargalo provavel: escrita SQLite, nao Elysia.
- Antes de trocar banco, garanta indices, queries preparadas, paginacao e payloads pequenos.
- Proximo passo natural em `/api/users`: paginacao, ordenacao explicita e busca mais eficiente por nome.
- Para alta escrita, migrar repository para Postgres mantendo service/controller estaveis.
- Para UI maior, separar build/deploy da UI sem mover regra de negocio para o frontend.
- Para operacao real, adicionar logs estruturados, request id, metricas de latencia por rota e tracing no boundary HTTP/repository.

Validacao minima antes de concluir qualquer mudanca:

```bash
bun run typecheck
bun test
```

Para alteracoes de build/runtime, rode tambem:

```bash
bun run build
bun run start:binary
```

Para alteracoes apenas documentais, pelo menos valide whitespace e diff:

```bash
git diff --check
git status --short
```
