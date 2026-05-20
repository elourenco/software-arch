# OpenAPI Scalar Spec URL Design

## 1. Resumo Executivo

O endpoint `/api/openapi/json` ja expoe o documento OpenAPI corretamente, incluindo os paths da API. A falha esta na pagina HTML de `/api/openapi`: o Scalar recebe a URL relativa `api/openapi/json`, que o browser resolve a partir de `/api/openapi` como `/api/api/openapi/json`.

A solucao aprovada e manter o provider Scalar e configurar explicitamente a URL absoluta do spec como `/api/openapi/json`.

## 2. Analise Tecnica

Estado observado:

- `/api/openapi/json` retorna OpenAPI `3.0.3` com 8 paths.
- `/api/openapi` retorna HTML do Scalar.
- O HTML atual injeta `data-configuration` com `url:"api/openapi/json"`.
- A URL relativa gera fetch para `/api/api/openapi/json`, endpoint inexistente para a UI.

O problema nao esta nos controllers, schemas Zod, rotas Elysia ou geracao do documento OpenAPI. O problema esta no contrato entre a pagina de documentacao e o endpoint JSON.

## 3. Implementacao

Alterar `src/api/app.ts` no registro de `@elysiajs/openapi`:

```ts
openapi({
  path: "/api/openapi",
  specPath: "/api/openapi/json",
  scalar: {
    url: "/api/openapi/json",
  },
  documentation: {
    info: { title: "Software Arch API", version: "1.0.0" },
    tags: [
      { name: "Health", description: "Runtime health checks" },
      { name: "Auth", description: "JWT authentication" },
      { name: "Users", description: "User CRUD operations" },
    ],
  },
})
```

Adicionar cobertura HTTP em `tests/http` para garantir:

- `/api/openapi/json` continua expondo os paths principais.
- `/api/openapi` renderiza o Scalar com `"/api/openapi/json"`.
- `/api/openapi` nao renderiza `url:"api/openapi/json"` sem barra inicial.

## 4. Trade-offs

- Mantem o provider Scalar e as URLs publicas ja documentadas.
- Mantem o carregamento em duas requisicoes: HTML da documentacao + JSON do spec.
- Evita `embedSpec: true`, que eliminaria o fetch mas aumentaria o HTML e reduziria eficiencia de cache conforme o spec crescer.
- Evita trocar para Swagger UI ou mover a documentacao para `/openapi`, que resolveria o sintoma mudando uma superficie publica sem necessidade.

## 5. Quando usar vs evitar

Use este ajuste porque o documento OpenAPI ja esta correto e a falha e apenas a URL usada pela UI.

Evite este ajuste se o objetivo mudar para documentacao offline ou ambiente sem acesso ao CDN do Scalar. Nesse caso, a decisao correta seria discutir `embedSpec`, empacotamento local do asset da UI ou outro provider.

## 6. Escalabilidade

O impacto em performance e latencia e praticamente nulo. A pagina continua leve e o spec continua cacheavel separadamente.

Para specs maiores, as proximas melhorias seriam cache headers para `/api/openapi/json`, controle de CDN/assets do Scalar e eventualmente protecao de acesso se a API virar interna. Nada disso e necessario para corrigir a exibicao atual dos endpoints.

## Validacao

Validacao minima apos implementar:

```bash
bun run typecheck
bun test
```

Como a mudanca afeta a pagina servida em runtime, validar tambem:

```bash
curl -sS http://localhost:3000/api/openapi | rg '"/api/openapi/json"'
curl -sS http://localhost:3000/api/openapi/json
```
