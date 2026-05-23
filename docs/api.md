# API

## 1. Resumo Executivo

A API expoe auth JWT, CRUD completo de `User`, gestao de `Product` e fluxo de
`Order` com multiplos itens, estoque transacional e dashboards administrativos,
tudo sob o prefixo `/api`.

## 2. Analise Tecnica

Rotas publicas:

```txt
GET  /api/health
POST /api/auth/register
POST /api/auth/login
```

Credencial administrativa inicial criada pelas migrations:

```txt
email: super@admin.app
password: 123456
role: admin
```

Essa conta e operacional: autentica no modulo `Auth`, mas nao entra nas
colecoes publicas do dominio `User` (`GET /api/users`, `/api/users/count` e
`GET /api/users/search`). Essas colecoes tambem excluem o proprio usuario
autenticado na request.

Rotas autenticadas:

```txt
GET    /api/auth/me

GET    /api/users
GET    /api/users/count
GET    /api/users/search?name=
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/products
GET    /api/products/count
GET    /api/products/:id
POST   /api/products              # admin
PUT    /api/products/:id          # admin
DELETE /api/products/:id          # admin

GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PATCH  /api/orders/:id/cancel

GET    /api/admin/dashboard       # admin
GET    /api/admin/orders          # admin
GET    /api/admin/orders/count    # admin
GET    /api/admin/orders/:id      # admin
PATCH  /api/admin/orders/:id/status # admin
```

OpenAPI:

```txt
GET /api/openapi
GET /api/openapi/json
```

## 3. Implementacao

Payload de criacao de usuario:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "strong-password",
  "role": "user"
}
```

Payload de produto:

```json
{
  "sku": "SKU-001",
  "name": "Teclado mecanico",
  "quantity": 12
}
```

Payload de criacao de pedido:

```json
{
  "items": [
    { "productId": "product-1", "quantity": 2 }
  ]
}
```

Payload de atualizacao de status admin:

```json
{
  "status": "concluido"
}
```

Regras principais:

- respostas publicas de usuario nunca incluem `passwordHash`;
- `sku` de produto e unico e normalizado para uppercase;
- produto com estoque zero pode ser listado, mas nao efetiva pedido;
- pedido inicia como `em_andamento`;
- itens duplicados do mesmo produto sao consolidados;
- pedido so e criado se todos os produtos tiverem estoque suficiente;
- criacao e cancelamento de pedido atualizam estoque em transacao SQLite;
- usuario normal so lista, visualiza e cancela pedidos proprios;
- usuario so cancela pedido `em_andamento`;
- admin altera status apenas para `em_andamento` ou `concluido`;
- pedido `cancelado` nao volta para outro status.

Smoke test local:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"super@admin.app","password":"123456"}'
```

## 4. Trade-offs

JWT stateless reduz dependencia de storage de sessao, mas logout global exigiria
refresh token ou denylist.

`OrderItem` guarda snapshot de SKU/nome. Isso duplica dados do produto, mas
preserva historico de pedido quando o catalogo muda.

Estoque fica direto em `products.quantity`, sem ledger de movimentacao. E mais
simples e suficiente para o desafio; auditoria forte exigiria uma tabela de
movimentos.

## 5. Quando usar vs evitar

Use o contrato atual para demonstrar API REST MVC de vendas on-line com
catalogo, estoque e pedidos basicos. Evite expandir para pagamento, reserva de
estoque ou fiscal sem novo desenho de dominio.

## 6. Escalabilidade

O gargalo provavel e escrita SQLite em criacao/cancelamento de pedidos. Antes de
trocar infraestrutura, priorize paginacao em listas, indices, payloads pequenos,
transacoes curtas e medicao de latencia por rota/repository.
