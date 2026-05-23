# Software Arch API

## 1. Resumo Executivo

### Introducao do projeto

Este repositorio implementa uma aplicacao fullstack para o desafio final de
Arquitetura de Software: uma API REST no padrao MVC que disponibiliza dados de
um dominio para parceiros de uma empresa de vendas on-line.

O dominio principal e `User`. A aplicacao entrega backend, frontend,
persistencia, documentacao OpenAPI, diagramas arquiteturais e binario compilado
em um unico projeto Bun. A escolha foi intencional: manter baixa friccao de
execucao, demonstrar arquitetura real e preservar um caminho claro de evolucao
sem introduzir infraestrutura desnecessaria para o escopo do desafio.

Stack real:

- Runtime e build: Bun.
- API: Elysia REST.
- Contratos: Zod.
- Documentacao: OpenAPI em `/api/openapi`.
- UI: React servida pelo mesmo processo Bun.
- Roteamento frontend: React Router.
- Persistencia: SQLite via `bun:sqlite`.
- Testes: `bun:test` com banco migrado em memoria.
- Build final: executavel em `dist/software-arch`.

Entregaveis principais:

- Checklist final: `docs/final-submission.md`.
- Arquitetura: `docs/architecture.md`.
- API: `docs/api.md`.
- Implantacao local/binario: `docs/deployment.md`.
- Diagramas fonte: `docs/diagrams/*.mmd` e `docs/diagrams/drawio/*.drawio`.
- Diagramas renderizados: `docs/diagrams/exports/*.svg` e
  `docs/diagrams/exports/*.png`.

## 2. Analise Tecnica

### Arquitetura em alto nivel

O projeto roda como um unico processo HTTP:

```txt
Cliente/UI
  -> Bun.serve
    -> /api/*          -> Elysia API
    -> outras rotas    -> React UI
```

O backend fica em `src/api` e segue MVC por modulo. A UI fica em `src/app` e
consome dados somente via `src/app/services/api-client.ts`. `src/server.ts` e o
entrypoint unico usado tanto no desenvolvimento quanto no build compilado.

Estrutura principal:

```txt
src/
  server.ts
  routes/
    api-router.ts
    frontend-router.ts
  api/
    app.ts
    config/
    database/
    modules/
      auth/
      user/
    shared/
  app/
    components/
    entrypoints/
    pages/
    services/
    styles/
tests/
  app/
  helpers/
  http/
  modules/
docs/
  architecture.md
  api.md
  deployment.md
  diagrams/
```

### Padroes usados

#### MVC por modulo

Cada dominio tem seu proprio conjunto de arquivos:

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

Esse formato deixa o MVC explicito por feature, reduz acoplamento entre
dominios e evita um MVC global onde todos os controllers, services e
repositories ficam espalhados por tipo tecnico.

#### Controller fino

Controllers recebem entrada ja validada pela rota/schema, chamam services e
devolvem resposta HTTP. Regra de negocio nao deve morar em controller.

#### Service stateless

Services concentram regra de negocio e orquestracao. Eles nao guardam estado
entre requests, o que melhora previsibilidade, concorrencia e testabilidade.

#### Repository com SQL isolado

Repositories encapsulam SQL, prepared statements e conversao entre linhas do
SQLite e modelos de dominio. A persistencia fica substituivel sem reescrever
controller, schema ou UI.

#### Schema Zod como boundary

Schemas Zod definem entrada e saida publica. Eles sao a primeira barreira contra
payload invalido e impedem validacao duplicada em controllers.

#### Mapper explicito

Mappers convertem modelo interno para DTO publico. Esse padrao evita vazamento
de campos sensiveis como `passwordHash`.

#### Auth guard

Rotas protegidas usam JWT via guard HTTP. O usuario autenticado entra no fluxo
como contexto de request, nao por leitura manual repetida em cada controller.

#### Error handling central

Erros de dominio sao convertidos para respostas HTTP padronizadas no boundary
compartilhado. Isso reduz branching nos controllers e mantem contratos de erro
previsiveis.

#### Migrations SQL

O banco evolui por migrations SQL versionadas em `src/api/database/migrations`.
Novas migrations precisam ser registradas em `src/api/database/migrate.ts`; o
runner nao faz discovery automatico por diretorio.

#### Runtime unico com boundary firme em `/api`

UI e API compartilham processo para simplificar entrega e reduzir latencia
local, mas a UI nao acessa banco nem regra de negocio. O contrato entre frontend
e backend continua sendo HTTP em `/api`.

### Fluxo de request

```txt
Request HTTP
  -> src/server.ts
  -> src/routes/api-router.ts
  -> src/api/app.ts
  -> <domain>.routes.ts
  -> <domain>.controller.ts
  -> <domain>.service.ts
  -> <domain>.repository.ts
  -> SQLite
```

No caminho inverso, o repository devolve modelo interno, service aplica regra de
negocio, mapper/schema garantem resposta publica e o error handler transforma
falhas conhecidas em status HTTP consistente.

## 3. Implementacao

### Como rodar

Instale dependencias:

```bash
bun install
```

Suba em modo desenvolvimento:

```bash
bun run dev
```

URLs locais:

- UI: `http://localhost:3000`
- Health: `http://localhost:3000/api/health`
- OpenAPI UI: `http://localhost:3000/api/openapi`
- OpenAPI JSON: `http://localhost:3000/api/openapi/json`

Variaveis de ambiente:

| Variavel | Default | Papel |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do processo Bun |
| `DATABASE_URL` | `data/software-arch.db` | Caminho do SQLite file-backed |
| `JWT_SECRET` | `development-secret-change-me` | Segredo HMAC para JWT |
| `NODE_ENV` | `development` | Ambiente de runtime |

Rodar em porta isolada:

```bash
PORT=3131 DATABASE_URL=/tmp/software-arch.db bun run dev
```

### Como autenticar

Credencial administrativa inicial:

```txt
email: super@admin.app
password: 123456
```

Essa conta e reservada para bootstrap administrativo: ela autentica, mas nao
aparece em `/api/users`, `/api/users/count` nem `/api/users/search`. Essas
colecoes tambem excluem o usuario autenticado na request.

Login via HTTP:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"super@admin.app","password":"123456"}'
```

Use o `accessToken` retornado no corpo da resposta como header de autorizacao:

```txt
Authorization: Bearer <accessToken>
```

### Como testar

Validacao minima antes de concluir mudancas de codigo:

```bash
bun run typecheck
bun test
```

Validacao para mudancas de build/runtime:

```bash
bun run typecheck
bun test
bun run build
bun run start:binary
```

Validacao para mudancas documentais:

```bash
git diff --check
git status --short
```

Testes por camada:

- `tests/http`: contrato HTTP, status codes, auth e OpenAPI.
- `tests/modules`: services e repositories por dominio.
- `tests/app`: boundaries do frontend, rotas, sessao e validacoes de UI.
- `tests/helpers/test-db.ts`: cria SQLite `:memory:` migrado para testes.

Executar um arquivo especifico:

```bash
bun test tests/http/users.routes.test.ts
```

### Como gerar o binario

O comando correto do projeto e:

```bash
bun run build
```

Nao use `bun build` sozinho para este repo. `bun build` e o bundler CLI de
baixo nivel e exige entrypoints; `bun run build` executa `scripts/build.ts` com
o pipeline correto de frontend, Tailwind e compile.

Depois do build:

```bash
PORT=3131 DATABASE_URL=/tmp/software-arch.db bun run start:binary
curl http://localhost:3131/api/health
```

### Como implementar um novo endpoint em `User`

Fluxo recomendado:

1. Atualize ou crie schemas em `src/api/modules/user/user.schema.ts`.
2. Adicione regra de negocio em `src/api/modules/user/user.service.ts`.
3. Adicione acesso SQL em `src/api/modules/user/user.repository.ts`.
4. Exponha a operacao em `src/api/modules/user/user.controller.ts`.
5. Registre a rota em `src/api/modules/user/user.routes.ts`.
6. Se houver novo payload/resposta publica, garanta mapper seguro em
   `src/api/modules/user/user.mapper.ts`.
7. Cubra o contrato com testes em `tests/http` e a regra em `tests/modules`.
8. Atualize `docs/api.md` quando o contrato HTTP mudar.

Regra pratica: controller nao decide regra de negocio, repository nao conhece
HTTP e UI nao replica validacao de backend.

### Como implementar um novo dominio

Crie um modulo com o mesmo formato do `user`:

```txt
src/api/modules/product/
  product.model.ts
  product.schema.ts
  product.repository.ts
  product.service.ts
  product.controller.ts
  product.routes.ts
  product.errors.ts
  product.mapper.ts
```

Depois:

1. Registre as rotas em `src/api/app.ts`.
2. Crie migration SQL se houver persistencia nova.
3. Registre a migration em `src/api/database/migrate.ts`.
4. Adicione testes de repository/service/HTTP.
5. Atualize OpenAPI implicito via schemas/rotas.
6. Atualize `docs/api.md`, `docs/architecture.md` e diagramas se o dominio
   alterar a arquitetura descrita.

### Como implementar UI consumindo a API

O frontend deve usar apenas `src/app/services/api-client.ts` para chamadas HTTP.
Nao coloque `fetch`, token JWT ou regra de negocio do backend diretamente em
page/component.

Fluxo recomendado:

1. Adicione metodo tipado no API client.
2. Reuse `src/app/services/auth-session.ts` para token/sessao.
3. Mantenha validacoes de formulario locais apenas para UX imediata.
4. Trate erro de API tipado quando o backend devolver erro de dominio.
5. Cubra comportamento com testes em `tests/app`.

## 4. Trade-offs

### Bun + Elysia

Reduz boilerplate, startup e custo operacional. O trade-off e menor
portabilidade para ambientes Node tradicionais e menor maturidade de ecossistema
do que Express/Fastify em operacoes corporativas antigas.

### Runtime unico para UI e API

Simplifica deploy, elimina CORS interno e reduz latencia local. O custo e
acoplar ciclo de release e escala da UI com a API. Para o desafio, isso melhora
avaliacao e reduz superficie operacional.

### SQLite via `bun:sqlite`

Remove dependencia externa e deixa SQL visivel. O limite natural e escrita
concorrente: SQLite e excelente para baixa/media escrita e leitura local rapida,
mas nao e a escolha certa para varias instancias escrevendo no mesmo banco.

### MVC por modulo

Mais arquivos do que um CRUD monolitico, mas melhor coesao por dominio e melhor
leitura arquitetural. Evita overengineering de Clean Architecture completa sem
abrir mao de boundaries reais.

### JWT stateless

Reduz I/O por request e simplifica escala horizontal da camada HTTP. O custo e
revogacao: logout global, bloqueio imediato e rotacao avancada exigiriam
denylist, refresh tokens ou sessao server-side.

### Zod como contrato

Centraliza validacao e documentacao de payload. O custo e manter schemas como
fonte de verdade; duplicar validacao em controller ou UI degrada o desenho.

## 5. Quando usar vs evitar

Use este desenho quando:

- O objetivo e demonstrar MVC, REST, OpenAPI e persistencia real.
- O produto e pequeno/medio, ferramenta interna ou API de parceiro com baixa
  concorrencia de escrita.
- A prioridade e deploy simples, latencia baixa e codigo facil de avaliar.
- O time quer evoluir por troca de repository/persistencia antes de redesenhar
  toda a aplicacao.

Evite ou reavalie quando:

- Houver necessidade real de multiplas instancias escrevendo no mesmo banco.
- A UI precisar deploy independente da API.
- O dominio exigir transacoes complexas, auditoria forte ou historico temporal.
- Auth exigir revogacao imediata, refresh tokens, RBAC granular ou SSO.
- Observabilidade, tracing distribuido e metricas por rota forem requisitos de
  producao desde o primeiro release.

## 6. Escalabilidade

### Gargalos esperados

O primeiro gargalo provavel e escrita SQLite, nao Elysia. O runtime e stateless
na camada de service/controller, mas o banco continua tendo limite de
single-writer. WAL e `busy_timeout` ajudam, mas nao transformam SQLite em banco
multi-writer distribuido.

### Antes de trocar banco

Priorize:

1. Paginacao e limite maximo em `GET /api/users`.
2. Ordenacao explicita e indices alinhados aos filtros.
3. Payloads menores e DTOs especificos por caso de uso.
4. Prepared statements em todo caminho quente.
5. Medicao de latencia p50/p95 por rota.
6. Medicao de tempo de query por repository.

### Evolucao natural

Quando volume ou concorrencia justificarem:

- Migrar `UserRepository` para Postgres mantendo service/controller estaveis.
- Adicionar paginacao cursor-based para listas grandes.
- Trocar busca `LIKE` por FTS ou search engine conforme requisito.
- Introduzir refresh tokens/denylist se revogacao de auth virar requisito.
- Separar deploy da UI se release independente trouxer valor real.
- Adicionar logs estruturados, request id, metricas e tracing no boundary HTTP e
  repository.

O ponto central: preservar o contrato de dominio e trocar infraestrutura por
necessidade medida, nao por preferencia arquitetural.
