# Users List Create Modal Design

## 1. Resumo Executivo

Reorganizar a pagina autenticada `/users` para ser uma lista operacional de usuarios, com uma tabela como superficie principal e uma coluna dedicada de acoes.

A acao primaria da tela passa a ser **Criar usuario**, posicionada acima da tabela e alinhada a direita. O clique abre um modal com formulario completo de criacao. O form inline atual sai da pagina porque mistura criacao, busca e listagem no mesmo bloco e hoje envia uma senha fixa.

A edicao usa o mesmo modal da criacao, aberto pela acao `Editar` da tabela e preenchido com os dados publicos do usuario. A senha fica vazia no modo edicao porque a API nao expoe senha nem hash; se preenchida, atualiza a senha. A exclusao passa a ficar acessivel diretamente na coluna de acoes da tabela.

## 2. Analise Tecnica

Estado atual:

- `src/app/pages/users/index.tsx` renderiza um `Card` com formulario inline de criacao, botao de busca e tabela.
- A criacao usa apenas `name` e `email` na UI e envia `password: "strong-password"` de forma fixa.
- A tabela mostra `name`, `email` e `role`; o nome linkava para `/users/:id`.
- A exclusao existe no detalhe `/users/:id`, nao na lista.
- Todo consumo HTTP da UI passa por `src/app/services/api-client.ts`, que deve continuar sendo o boundary unico para `/api`.
- `POST /api/users` ja usa `createUserSchema` em `src/api/modules/user/user.routes.ts`.

Contrato backend de criacao ja existente:

- `name`: string com minimo de 2 caracteres.
- `email`: email valido.
- `password`: string com minimo de 8 caracteres.
- `role`: enum `admin | user`, com default `user`.

Problemas a corrigir:

- A UI nao coleta todos os campos relevantes para criacao.
- A validacao client-side nao espelha o contrato minimo da API.
- O submit atual pode gerar request invalido ou semanticamente inseguro sem feedback local.
- A tabela nao tem coluna explicita de acoes, tornando edicao/exclusao menos descobrivel.

Decisao aprovada:

- Abrir o modal preenchido ao clicar em `Editar`.
- Reutilizar o mesmo formulario para criacao e edicao.
- Adicionar a coluna `Acoes` na tabela com `Editar` e `Deletar`.
- Validar criacao/edicao na UI antes do request e preservar as validacoes do backend como fonte de verdade.

## 3. Implementacao

Alteracoes planejadas no frontend:

1. Atualizar `src/app/pages/users/index.tsx`.
   - Remover o formulario inline de criacao.
   - Manter carregamento de usuarios via `api.get<User[]>("/users")`.
   - Posicionar o botao **Criar usuario** no topo da superficie da tabela, alinhado a direita.
   - Abrir/fechar modal local de criacao e edicao.
   - Preencher `name`, `email` e `role` no modo edicao; deixar `password` vazio.
   - Recarregar a lista apos criacao/edicao bem-sucedida.
   - Fechar o modal somente apos sucesso da API.
   - Bloquear o botao de submit enquanto a criacao estiver em andamento.

2. Criar ou reutilizar componentes pequenos de UI.
   - Se nao houver `Dialog`/modal local, criar um componente simples em `src/app/components/ui/dialog.tsx` usando `radix-ui`, que ja esta nas dependencias.
   - Preservar o padrao shadcn manual ja usado por `button`, `input`, `label`, `card` e `table`.
   - Evitar dependencia nova.

3. Evoluir `Field` apenas se necessario.
   - Aceitar `error`, `required`, `autoComplete` e props nativas de input sem quebrar chamadas atuais.
   - Exibir erro perto do campo com texto curto.

4. Implementar validacao client-side no modal.
   - `name.trim().length >= 2`.
   - `email` em formato valido.
   - `password.length >= 8` na criacao.
   - `password` opcional na edicao, mas com minimo de 8 caracteres quando preenchido.
   - `role` limitado a `admin | user`.
   - Mostrar erros antes de enviar request.

5. Atualizar tabela.
   - Colunas: `Nome`, `Email`, `Role`, `Acoes`.
   - `Editar` abre o modal preenchido.
   - `Deletar` chama `DELETE /api/users/:id`.
   - Durante delete, bloquear apenas a linha afetada quando possivel.
   - Apos delete bem-sucedido, remover o usuario da lista local ou recarregar `/users`. Recarregar e mais simples e consistente com o estado atual.

6. Tratamento de erros de API na UI.
   - `409 EMAIL_ALREADY_EXISTS`: mostrar mensagem de email ja cadastrado.
   - `400 VALIDATION_ERROR`: mostrar mensagem de dados invalidos.
   - `401`: manter comportamento atual do guard autenticado; se a chamada falhar por auth, a pagina pode exibir erro generico ou ser redirecionada pelo fluxo existente em nova navegacao.
   - Falhas desconhecidas: mensagem curta e nao tecnica.

Alteracoes planejadas no backend:

1. Verificar que `src/api/modules/user/user.routes.ts` continua aplicando `createUserSchema` no body de `POST /api/users`.
2. Adicionar teste HTTP para criacao invalida em `tests/http/users.routes.test.ts`.
   - Payload com `name` curto, `email` invalido ou `password` curta deve retornar `400`.
   - Payload valido continua retornando `201`.
3. Nao mudar contrato publico da API se a validacao existente ja estiver correta.

## 4. Trade-offs

- Modal para criacao/edicao reduz ruido visual e evita form permanente na pagina, mas adiciona estado local de abertura, modo, loading e erros.
- Validacao client-side duplica parte do contrato Zod, mas reduz latencia percebida e evita round-trips invalidos no caminho comum. O backend continua sendo a fonte de verdade.
- Reutilizar o modal para edicao alinha create/edit na lista, mas exige tratar senha como campo opcional no modo edicao porque o valor atual nao pode ser preenchido.
- Recarregar a lista apos create/delete e mais simples e resiliente contra estado local stale, mas custa uma requisicao extra. Para o volume atual do projeto, esse custo e aceitavel.
- Nao introduzir paginacao mantem escopo pequeno, mas `GET /api/users` segue sendo o gargalo natural quando o volume crescer.

## 5. Quando usar vs evitar

Use este desenho quando:

- O CRUD e administrativo e a lista e a principal superficie de trabalho.
- A criacao deve ser rapida, validada e sem sair da pagina.
- A edicao deve acontecer sem sair da lista.
- O volume de usuarios ainda cabe em `GET /api/users` sem paginacao.

Evite expandir este changeset para:

- Bulk actions.
- Paginacao, ordenacao server-side ou filtros avancados.
- RBAC visual para esconder `admin`.
- Novo framework de formulario.

Esses itens so devem entrar quando houver requisito explicito ou problema real de volume, permissao ou produtividade.

## 6. Escalabilidade

Performance e latencia:

- O caminho quente da pagina continua sendo `GET /api/users`.
- Criacao, edicao e exclusao fazem escrita SQLite e um reload da lista.
- O modal evita requests antes de passar na validacao local.
- O submit deve ter loading para impedir duplo clique e criacao concorrente acidental pelo mesmo cliente.

Concorrencia e throughput:

- SQLite continua single-writer; criar/deletar usuarios em volume alto concorrente pode bater no limite de escrita antes da API.
- `EMAIL_ALREADY_EXISTS` continua sendo protegido por constraint unica e convertido em erro de dominio.
- A UI nao deve assumir que a validacao local garante exclusividade de email.

Falhas e resiliencia:

- Backend rejeita payload invalido com `400 VALIDATION_ERROR`.
- Backend rejeita email duplicado com `409 EMAIL_ALREADY_EXISTS`.
- UI deve preservar dados do modal em erro recuperavel para o usuario corrigir.
- UI deve evitar fechar modal em falha de criacao.
- Delete deve recuperar a lista apos sucesso para reduzir risco de estado divergente.

Validacao minima apos implementar:

```bash
bun run typecheck
bun test
```

Validacao manual recomendada:

```bash
bun run dev
```

- Abrir `/users` autenticado.
- Confirmar botao **Criar usuario** acima da tabela e alinhado a direita.
- Abrir modal, validar campos obrigatorios e erros locais.
- Criar usuario valido e confirmar fechamento do modal e reload da tabela.
- Tentar email duplicado e confirmar feedback sem fechar modal.
- Clicar `Editar` e confirmar modal preenchido.
- Salvar edicao com senha vazia e confirmar fechamento do modal e reload da tabela.
- Clicar `Deletar` e confirmar remocao da lista.
