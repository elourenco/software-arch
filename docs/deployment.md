# Deployment Guide

## 1. Resumo Executivo

O projeto roda como um unico processo Bun que serve API REST e UI React. Para a
entrega do desafio, ha dois modos validos: desenvolvimento local com `bun run
dev` e binario compilado com `bun run build`.

## 2. Analise Tecnica

Variaveis de ambiente:

| Variavel | Default | Papel |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do processo Bun |
| `DATABASE_URL` | `data/software-arch.db` | Caminho do SQLite file-backed |
| `JWT_SECRET` | `development-secret-change-me` | Segredo HMAC para JWT |
| `NODE_ENV` | `development` | Ambiente de runtime |

O startup cria o diretorio do banco quando necessario, abre SQLite em modo
`strict`, habilita `foreign_keys`, aplica `busy_timeout` e usa WAL fora de
`:memory:`.

## 3. Implementacao

Desenvolvimento local:

```bash
bun install
bun run dev
```

Build do binario:

```bash
bun run build
```

Execucao do binario:

```bash
PORT=3000 \
DATABASE_URL=data/software-arch.db \
JWT_SECRET=development-secret-change-me \
NODE_ENV=production \
bun run start:binary
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Documentacao:

```txt
http://localhost:3000/api/openapi
http://localhost:3000/api/openapi/json
```

## 4. Trade-offs

Um deploy unico reduz acoplamento operacional externo e simplifica avaliacao.
O custo e que UI e API compartilham ciclo de release e capacidade de escala.
Para o desafio, esse trade-off e favoravel: menos infraestrutura, menor
latencia local e contrato facil de validar.

## 5. Quando usar vs evitar

Use o binario compilado quando a entrega precisa ser reproduzivel sem rodar o
watcher do Bun. Use `bun run dev` durante desenvolvimento.

Evite o processo unico quando UI e API precisarem de releases independentes ou
quando multiplas instancias precisarem escrever no mesmo SQLite local.

## 6. Escalabilidade

Antes de trocar arquitetura, medir:

- Latencia p50/p95 por rota.
- Tempo de query no repository.
- Taxa de escrita concorrente.
- Tempo de resposta de `GET /api/users` com volume real.

Se escrita concorrente virar gargalo, migrar `UserRepository` para Postgres e
preservar o contrato HTTP.
