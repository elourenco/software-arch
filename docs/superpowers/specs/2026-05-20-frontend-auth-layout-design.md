# Frontend Auth Layout Design

## 1. Resumo Executivo

Separar a navegacao do frontend em dois layouts:

- area publica: sem sidebar, com header simples contendo somente o link para `/api/openapi`;
- area autenticada: com sidebar para navegacao principal e header contendo o link para `/api/openapi`.

A area autenticada deve ser baseada em sessao real, nao apenas em rota. O guard deve validar `localStorage.accessToken` chamando `/api/auth/me`; token ausente, invalido ou expirado redireciona para `/login`.

A solucao aprovada e usar layouts aninhados no React Router, preservando o app React manual servido pelo `Bun.serve` e mantendo todo consumo HTTP no boundary `src/app/services/api-client.ts`.

## 2. Analise Tecnica

Estado atual:

- `src/app/routes.tsx` usa uma unica raiz com `Shell`.
- `src/app/components/Shell.tsx` mistura links publicos, privados e OpenAPI no mesmo nav.
- `/login`, `/`, `/users` e `/users/:id` compartilham o mesmo chrome.
- paginas privadas usam `localStorage.accessToken` apenas na chamada da API, sem guard central.
- backend ja expoe `/api/auth/me`, que e o contrato correto para validar sessao.

Problema:

- o login exibe navegacao privada;
- telas privadas podem renderizar antes de descobrir que a sessao e invalida;
- o layout nao comunica boundary publico vs autenticado;
- o `Shell` atual tende a acumular condicionais se novas rotas forem adicionadas.

Decisao:

- substituir o `Shell` unico por layouts de rota pequenos;
- manter `PublicLayout` para rotas publicas;
- criar `AuthenticatedLayout` para rotas privadas;
- inserir `RequireAuth` no grupo privado para validar sessao antes de renderizar o conteudo.

## 3. Implementacao

Alteracoes planejadas:

1. Ajustar `src/app/routes.tsx` para usar dois grupos de rotas:
   - grupo publico com `PublicLayout` e rota `/login`;
   - grupo autenticado com `RequireAuth`, `AuthenticatedLayout`, `/`, `/users` e `/users/:id`.
2. Criar componentes em `src/app/components`:
   - `PublicLayout.tsx`;
   - `AuthenticatedLayout.tsx`;
   - `RequireAuth.tsx`.
3. Mover a navegacao privada para a sidebar do `AuthenticatedLayout`:
   - `Dashboard` apontando para `/`;
   - `Users` apontando para `/users`.
4. Manter o link de documentacao em ambos os headers:
   - `href="/api/openapi"`;
   - fora do roteamento SPA, porque e uma pagina servida pela API.
5. Implementar `RequireAuth` com:
   - leitura de `localStorage.getItem("accessToken")`;
   - chamada `api.get("/auth/me")`;
   - estado de loading curto enquanto valida;
   - `localStorage.removeItem("accessToken")` em falha;
   - redirect para `/login` preservando `location` em `state.from` quando o usuario tentou abrir uma rota privada.
6. Ajustar `LoginPage` para redirecionar apos login bem-sucedido:
   - para `state.from` quando o login veio de um redirect de rota privada;
   - para `/` quando o acesso ao login foi direto.
7. Atualizar CSS em `src/app/styles/global.css`:
   - classes para layout publico;
   - grid/flex para layout autenticado com sidebar;
   - responsividade para viewport menor, mantendo navegacao acessivel e sem overflow.
8. Remover ou substituir `Shell.tsx` se ele ficar sem uso.

O API client continua como unico boundary HTTP do frontend. Nenhuma regra de negocio do backend deve ser duplicada no React.

## 4. Trade-offs

- Validar `/api/auth/me` adiciona uma requisicao no primeiro acesso privado, aumentando a latencia inicial da area autenticada. Em troca, a UI passa a refletir auth real e remove token invalido localmente.
- Layouts aninhados adicionam alguns componentes, mas evitam um `Shell` condicional e deixam o crescimento de rotas privadas mais previsivel.
- Nao introduzir `AuthProvider` reduz complexidade agora, mas significa que cada necessidade global futura de usuario logado pode exigir evolucao para contexto.
- Preservar `/api/openapi` como link externo evita acoplar documentacao ao router SPA, mas causa navegacao full page para a pagina Scalar, o que e correto para este projeto.

## 5. Quando usar vs evitar

Use este desenho porque o repo ja tem React Router, JWT e `/api/auth/me`. Ele atende a separacao visual solicitada sem trocar framework, runtime ou boundary de API.

Evite evoluir agora para auth context completo, refresh token, RBAC visual ou menu dinamico por permissao. Esses itens so fazem sentido se houver requisito real de sessao longa, revogacao, perfis complexos ou multiplos dominios privados.

Evite tambem proteger rotas apenas por presenca de token em `localStorage`; isso reduz uma chamada HTTP, mas deixa sessao expirada parecer valida ate a primeira falha de API.

## 6. Escalabilidade

O desenho escala por composicao de rotas:

- novas telas publicas entram no grupo `PublicLayout`;
- novas telas privadas entram no grupo `AuthenticatedLayout`, herdando guard e sidebar;
- troca futura de SQLite, auth ou API nao exige reescrever layout, desde que `/api/auth/me` continue como contrato de sessao.

Performance esperada:

- impacto principal e uma chamada de validacao por montagem do grupo privado;
- payload de `/api/auth/me` e pequeno;
- sem polling, sem estado global pesado e sem dependencia nova.

Concorrencia e resiliencia:

- o guard nao aumenta escrita no SQLite;
- falhas de rede, token invalido ou expirado degradam para `/login`;
- erro de API privada continua tratado pela camada HTTP existente;
- o backend permanece fonte de verdade da sessao.

Validacao minima apos implementar:

```bash
bun run typecheck
bun test
```

Validacao manual recomendada:

```bash
bun run dev
```

- acessar `/login` e confirmar header sem sidebar;
- acessar `/` sem token e confirmar redirect para `/login`;
- fazer login e confirmar redirect para `/`;
- confirmar sidebar em `/`, `/users` e `/users/:id`;
- confirmar link `/api/openapi` nos dois headers;
- remover/invalidar token e confirmar retorno para `/login`.
