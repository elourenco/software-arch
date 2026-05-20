# Admin User Seed Design

## 1. Resumo Executivo

Adicionar uma migration idempotente para criar um usuario administrativo inicial no banco SQLite:

- Email: `super@admin.app`
- Senha: `123456`
- Role: `admin`

A migration deve ser nao destrutiva: se o email ja existir, nao deve sobrescrever `password_hash`, `role`, `name` ou timestamps. Isso preserva alteracoes feitas em bancos persistentes e evita reset acidental de credenciais.

## 2. Analise Tecnica

O projeto aplica migrations pelo runner embutido em `src/api/database/migrate.ts`, nao por leitura dinamica da pasta `src/api/database/migrations`. Portanto a mudanca precisa existir em dois pontos:

- arquivo SQL versionado em `src/api/database/migrations/002_seed_admin_user.sql`;
- entrada correspondente no array `migrations` em `src/api/database/migrate.ts`.

O seed deve inserir diretamente em `users`, respeitando o schema atual:

- `id` fixo para deixar o seed deterministico;
- `name = 'Super Admin'`;
- `email = 'super@admin.app'`;
- `password_hash` bcrypt gerado por `Bun.password.hash` ou formato aceito por `Bun.password.verify`;
- `role = 'admin'`;
- `created_at` e `updated_at` fixos ou definidos no SQL da migration.

A idempotencia deve ser controlada no SQL com `INSERT ... SELECT ... WHERE NOT EXISTS`, evitando conflito no indice unico de email e evitando mutacao de usuario ja existente.

## 3. Implementacao

Alteracoes planejadas:

1. Criar `src/api/database/migrations/002_seed_admin_user.sql`.
2. Registrar `002_seed_admin_user` em `src/api/database/migrate.ts` com o SQL equivalente ao arquivo versionado.
3. Adicionar cobertura em teste para banco novo:
   - `runMigrations` cria `super@admin.app`;
   - o usuario tem `role = 'admin'`;
   - `verifyPassword('123456', passwordHash)` retorna `true`;
   - chamar `runMigrations` novamente nao duplica usuarios.
4. Adicionar cobertura HTTP ou de service para login:
   - `POST /api/auth/login` com `super@admin.app` e `123456` retorna `200`;
   - resposta publica nao expoe `passwordHash`.

Validacao minima:

```bash
bun run typecheck
bun test
```

## 4. Trade-offs

Versionar um hash de senha no SQL e aceitavel para seed academico/local, mas nao e um padrao forte para producao. Em ambiente real, a credencial inicial deveria vir de secret manager, bootstrap one-time, invite administrativo ou exigir rotacao no primeiro login.

O seed em migration melhora previsibilidade e remove setup manual, mas acopla uma credencial inicial ao historico de schema. A mitigacao e manter o comportamento idempotente e nao destrutivo.

## 5. Quando usar vs evitar

Use esta abordagem para este repositorio porque o objetivo e facilitar o acesso administrativo inicial sem depender de script externo, mantendo o fluxo de migrations como fonte unica do setup de banco.

Evite esta abordagem se o sistema for exposto publicamente com a senha padrao ativa, se houver ambientes multi-tenant, ou se o admin inicial precisar de governanca de credenciais, auditoria forte ou rotacao obrigatoria.

## 6. Escalabilidade

O impacto em performance, latencia e throughput e irrelevante no caminho quente: a migration roda uma vez por banco e fica registrada em `schema_migrations`.

Em concorrencia, o SQLite continua protegido pelo fluxo transacional do runner e pelo indice unico em `users.email`. O gargalo natural de escrita do SQLite nao muda, porque nao ha seed recorrente no startup apos a migration ser aplicada.

Para evolucao real, o proximo passo seria substituir credenciais fixas por bootstrap operacional seguro, sem alterar controllers, services ou repositories.
