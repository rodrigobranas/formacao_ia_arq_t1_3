# Modelo de dados (PostgreSQL)

Este documento descreve o schema público do banco usado pelo helpdesk, alinhado ao que existe no Postgres (via `database/init.sql` e introspecção). Conexão típica (variáveis `DB_*` em `packages/backend/.env`): host, porta, nome do banco, usuário e senha.

## Visão geral (multi-tenant)

O isolamento por cliente/empresa é feito com **`organizations`**. Usuários internos, tipos de chamado e tickets pertencem a **uma organização**. Chamados públicos guardam contato do solicitante e referenciam tipo e (opcionalmente) agente responsável.

## Diagrama de relações

```
organizations (1) ──< (N) users
organizations (1) ──< (N) ticket_types
organizations (1) ──< (N) tickets

ticket_types (1) ──< (N) tickets          [ticket_type_id pode ser NULL]

users (1) ──< (N) tickets                 [assigned_to_id pode ser NULL]
users (1) ──< (N) ticket_comments
users (1) ──< (N) ticket_assignments      [como assigned_to e assigned_by]

tickets (1) ──< (N) ticket_comments
tickets (1) ──< (N) ticket_attachments
tickets (1) ──< (N) ticket_assignments

ticket_comments (1) ──< (0..N) ticket_attachments   [ticket_comment_id opcional]
```

## Tabelas e campos

### `health_check`

Uso operacional simples (ping ao banco).

| Campo        | Tipo                         | Significado         |
| ------------ | ---------------------------- | ------------------- |
| `id`         | `serial` / PK                | Identificador       |
| `checked_at` | `timestamp`, default `now()` | Momento do registro |

### `organizations`

Tenant (empresa/cliente do helpdesk).

| Campo  | Tipo           | Significado                                        |
| ------ | -------------- | -------------------------------------------------- |
| `id`   | PK             | Identificador                                      |
| `name` | `varchar(100)` | Nome exibível                                      |
| `slug` | `varchar(100)` | Identificador estável na URL/config (único global) |

**Relações:** pai de `users`, `ticket_types`, `tickets`.

### `users`

Operadores do sistema (admin e agentes), sempre ligados a uma organização.

| Campo             | Tipo                 | Significado                                              |
| ----------------- | -------------------- | -------------------------------------------------------- |
| `id`              | PK                   | Identificador                                            |
| `name`            | `varchar(100)`       | Nome                                                     |
| `email`           | `varchar(255)`       | E-mail de login; unicidade por **lower(email)** (índice) |
| `password`        | `varchar(255)`       | Hash de senha                                            |
| `admin`           | `boolean`            | Perfil administrativo (default `false`)                  |
| `organization_id` | FK → `organizations` | Organização do usuário (NOT NULL)                        |

**Relações:** comentários, vínculos de atribuição, e opcionalmente responsável atual em `tickets.assigned_to_id`.

### `ticket_types`

Categorias de chamado **por organização** (ex.: Dúvida, Problema, Sugestão).

| Campo             | Tipo                 | Significado                 |
| ----------------- | -------------------- | --------------------------- |
| `id`              | PK                   | Identificador               |
| `name`            | `varchar(50)`        | Nome do tipo                |
| `description`     | `varchar(255)`       | Descrição opcional (NULL)   |
| `organization_id` | FK → `organizations` | Dono do catálogo (NOT NULL) |

**Regra:** unicidade de nome por organização — índice único em `(lower(name), organization_id)`.

### `tickets`

Chamado aberto pelo cliente final; dados de contato são do solicitante (não precisam existir em `users`).

| Campo             | Tipo                 | Significado                                                                   |
| ----------------- | -------------------- | ----------------------------------------------------------------------------- |
| `id`              | PK                   | Identificador                                                                 |
| `code`            | `varchar(12)`        | Código legível do ticket (único global)                                       |
| `status`          | `varchar(20)`        | Estado do fluxo (default `'new'`; ex.: `new`, `assigned`, `closed`)           |
| `name`            | `varchar(100)`       | Nome do solicitante                                                           |
| `email`           | `varchar(255)`       | E-mail do solicitante                                                         |
| `phone`           | `varchar(50)`        | Telefone                                                                      |
| `description`     | `text`               | Texto do pedido                                                               |
| `ticket_type_id`  | FK → `ticket_types`  | Classificação (NULL permitido)                                                |
| `assigned_to_id`  | FK → `users`         | Agente responsável no momento (NULL = não atribuído)                          |
| `organization_id` | FK → `organizations` | Tenant (NOT NULL)                                                             |
| `created_at`      | `timestamp`          | Criação (default `now()`)                                                     |
| `updated_at`      | `timestamp`          | Última atualização (default `now()`)                                          |
| `sentiment`       | `varchar(20)`        | `positive`, `neutral`, `negative` ou `NULL` (CHECK `tickets_sentiment_check`) |

**Índices de apoio:** `(organization_id, status)`, `(organization_id, created_at)`, `(organization_id, status, created_at)`.

### `ticket_comments`

Mensagens de agentes (usuários internos) sobre o ticket.

| Campo        | Tipo           | Significado         |
| ------------ | -------------- | ------------------- |
| `id`         | PK             | Identificador       |
| `ticket_id`  | FK → `tickets` | Chamado (NOT NULL)  |
| `user_id`    | FK → `users`   | Autor (NOT NULL)    |
| `content`    | `text`         | Corpo da mensagem   |
| `created_at` | `timestamp`    | Momento da postagem |

### `ticket_attachments`

Arquivo anexado ao ticket; pode estar ligado a um comentário específico (`ticket_comment_id` opcional).

| Campo               | Tipo                   | Significado                                        |
| ------------------- | ---------------------- | -------------------------------------------------- |
| `id`                | PK                     | Identificador                                      |
| `ticket_id`         | FK → `tickets`         | Chamado (NOT NULL)                                 |
| `ticket_comment_id` | FK → `ticket_comments` | Amarra ao comentário se preenchido                 |
| `filename`          | `varchar(255)`         | Nome do arquivo                                    |
| `content_type`      | `varchar(100)`         | MIME type                                          |
| `content`           | `text`                 | Conteúdo persistido (camada de app define formato) |
| `created_at`        | `timestamp`            | Criação                                            |

### `ticket_assignments`

Registro de eventos de **atribuição**: para quem foi encaminhado e quem atribuiu.

| Campo            | Tipo           | Significado           |
| ---------------- | -------------- | --------------------- |
| `id`             | PK             | Identificador         |
| `ticket_id`      | FK → `tickets` | Chamado               |
| `assigned_to_id` | FK → `users`   | Agente que recebeu    |
| `assigned_by_id` | FK → `users`   | Quem fez a atribuição |
| `created_at`     | `timestamp`    | Momento do evento     |

**Nota:** `tickets.assigned_to_id` tende a refletir o responsável **atual**; `ticket_assignments` guarda o **histórico** de atribuições.

## Chaves estrangeiras

| Tabela               | Coluna              | Referência            |
| -------------------- | ------------------- | --------------------- |
| `users`              | `organization_id`   | `organizations(id)`   |
| `ticket_types`       | `organization_id`   | `organizations(id)`   |
| `tickets`            | `organization_id`   | `organizations(id)`   |
| `tickets`            | `ticket_type_id`    | `ticket_types(id)`    |
| `tickets`            | `assigned_to_id`    | `users(id)`           |
| `ticket_comments`    | `ticket_id`         | `tickets(id)`         |
| `ticket_comments`    | `user_id`           | `users(id)`           |
| `ticket_attachments` | `ticket_id`         | `tickets(id)`         |
| `ticket_attachments` | `ticket_comment_id` | `ticket_comments(id)` |
| `ticket_assignments` | `ticket_id`         | `tickets(id)`         |
| `ticket_assignments` | `assigned_to_id`    | `users(id)`           |
| `ticket_assignments` | `assigned_by_id`    | `users(id)`           |

## Índices e unicidade relevantes

- `organizations.slug` — UNIQUE.
- `users` — índice único `lower(email)`.
- `ticket_types` — índice único `(lower(name), organization_id)`.
- `tickets.code` — UNIQUE.
- `tickets` — índices compostos por organização + status/data (listagens).
