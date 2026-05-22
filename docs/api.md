# API

## 1. Resumo Executivo

A API expoe auth JWT simples e CRUD completo de users sob o prefixo `/api`.

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
```

## 3. Implementacao

Payload de criacao:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "strong-password",
  "role": "user"
}
```

Respostas publicas nunca incluem `passwordHash`.

`POST /api/auth/login` aceita qualquer senha nao vazia para permitir verificacao de credenciais existentes. A politica de senha forte permanece nas operacoes que criam ou atualizam senha.

## 4. Trade-offs

JWT stateless reduz dependencia de storage de sessao, mas logout global exigiria refresh token ou denylist.

## 5. Quando usar vs evitar

Use o contrato atual para CRUD simples de parceiros. Evite expandir `User` como agregado generico; novos dominios devem virar novos modules.

## 6. Escalabilidade

Adicionar paginacao em `/api/users` e busca full-text sao os proximos passos naturais quando volume crescer.
