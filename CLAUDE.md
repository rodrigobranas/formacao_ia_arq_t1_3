# Helpdesk Example

> **IMPORTANTE: Este e um projeto apresentado em um curso.**
> Todo codigo gerado DEVE ser o mais simples, expressivo e idiomatico possivel.
> Evite tipos complexos, generics elaborados, abstraccoes desnecessarias ou patterns avancados.
> O objetivo e que qualquer aluno consiga ler e entender o codigo rapidamente.
> Prefira clareza sobre elegancia. Codigo obvio e melhor que codigo "inteligente".

## O que e o projeto

Sistema de helpdesk multi-tenant com:

- **Backend** (Express + PostgreSQL) - API REST para gerenciar tickets, usuarios e organizacoes
- **Frontend** (React + Vite + Tailwind + Shadcn) - SPA com dashboard, gestao de tickets e area publica

## Estrutura de pastas

```
packages/
  backend/
    src/
      routes/       # Definicao de rotas HTTP
      services/     # Logica de negocio
      data/         # Acesso a dados (banco, repositorios)
  frontend/
    src/
      assets/       # Arquivos estaticos
      components/   # Componentes reutilizaveis
      config/       # Configuracao e variaveis de ambiente
      hooks/        # Custom hooks
      pages/        # Componentes de pagina (rotas)
      services/     # Chamadas a API e integracoes
      store/        # Gerenciamento de estado (Context API)
      styles/       # Estilos globais
      types/        # Tipos TypeScript
      utils/        # Funcoes utilitarias
database/
  init.sql          # Schema + seed data (PostgreSQL)
docker/
  docker-compose.yml  # Postgres dev (5432) + test (5433)
```

Nao crie novas pastas sem confirmar antes.

## Comandos

```bash
make setup      # Instala deps + sobe Docker
make dev        # Roda backend (3000) + frontend (5173)
make test       # Roda testes (Vitest + Jest)
make typecheck  # Verifica tipos
make db:reset   # Recria o banco dev
```

## Stack

- **Runtime:** Bun
- **Backend:** Express 5, pg-promise, Zod, JWT (jsonwebtoken), bcrypt
- **Frontend:** React 19, React Router 7, Tailwind 4, Radix UI / Shadcn, Recharts, i18next
- **AI:** Vercel AI SDK + OpenAI
- **Testes:** Jest (backend), Vitest + Testing Library (frontend)

## TypeScript

- Todo codigo em TypeScript, nunca usar `any`
- Sempre `import`/`export`, nunca `require`/`module.exports`
- `const` por padrao, `let` so quando reatribuicao for necessaria, nunca `var`
- Arrow functions preferidas
- `async/await` sempre, nunca callbacks ou `.then()`
- Prefira `find`, `filter`, `map`, `reduce` ao inves de `for`/`while`
- Export default quando o arquivo exporta uma unica coisa, named exports quando exporta varias
- Propriedades de classe: `private` ou `readonly`, evitar `public`
- Valide a tipagem antes de finalizar qualquer tarefa

## Naming

- Codigo fonte sempre em ingles
- camelCase para variaveis, funcoes e metodos
- PascalCase para classes, interfaces e componentes React
- UPPER_SNAKE_CASE para constantes
- Pastas sempre em kebab-case
- Arquivos frontend: PascalCase para componentes (`UserCard.tsx`), camelCase para hooks/utils/services (`useAuth.ts`, `formatDate.ts`). Excecao: componentes Shadcn mantem kebab-case
- Arquivos backend: camelCase por padrao (`authRoutes.ts`, `userService.ts`), PascalCase so para classes/DTOs/entities (`User.ts`, `CreateUserDto.ts`)
- Nomes de funcoes comecam com verbo (`calculateTotal`, `sendEmail`), nunca substantivo
- Sem abreviacoes, mas nomes com ate 30 caracteres
- Constantes nomeadas para magic numbers

## Estilo de codigo

- Maximo 3 parametros por funcao, usar objeto se precisar de mais
- CQS: funcao faz mutacao OU consulta, nunca as duas coisas
- Maximo 2 niveis de if/else, preferir early returns, evitar `else`
- Sem flag params que mudam comportamento — separe em funcoes distintas
- Metodos ate 50 linhas, classes ate 300 linhas
- Sem comentarios desnecessarios
- Uma variavel por linha, declarada perto de onde sera usada

## API/REST/HTTP

- Express para todas as rotas, nao instalar outras libs HTTP
- Recursos em ingles, plural, navegaveis: `/tickets/:ticketId/comments`
- Recursos compostos em kebab-case: `/scheduled-events`
- Maximo 3 niveis de recursos na URL
- Leituras seguem REST padrao (GET)
- Mutacoes usam POST + verbo de acao: `POST /tickets/:id/close`, `POST /users/:userId/change-password` (nunca PUT para mutacoes)
- Payload sempre JSON
- Toda rota precisa de middleware de autenticacao/autorizacao
- Status codes: 200 sucesso, 400 request malformado, 401 nao autenticado, 403 nao autorizado, 404 nao encontrado, 422 erro de regra de negocio, 500 erro inesperado
- Paginacao via query string: `?limit=10&offset=20`
- Partial response: `?fields=id,name,createdAt`
- Documentar endpoints com OpenAPI
- Usar `fetch` nativo para chamar APIs externas, nao instalar libs como axios

## React / Frontend

- Componentes funcionais, nunca classes
- Extensao `.tsx` para componentes
- Estado o mais proximo possivel de onde e usado
- Props explicitas, sem spread (`{...props}`)
- Componentes ate 100 linhas
- Context API para comunicacao entre componentes filhos
- Tailwind para estilos, nunca styled-components
- Sempre usar componentes Shadcn
- `useMemo` para calculos pesados entre renders
- Reutilizar componentes existentes — perguntar antes de criar novos
- Testes automatizados para todos os componentes

## Testes

- Rodar com `make test`
- Padrao Arrange / Act / Assert
- Cada teste e independente, sem dependencias entre eles
- Um comportamento por teste, descricao clara e objetiva
- Testes de endpoints HTTP: integracao, sem supertest, foco em status codes e mensagens de erro nos fluxos principal e alternativos
- Testes de services/use cases: testar fluxo principal + pelo menos um fluxo alternativo com excecao, usar stubs para APIs externas
- Testes de dominio: unitarios, sem recursos externos, cobrir todas as variacoes de regra
- Mock de Date quando o comportamento depende de data
- `beforeEach` para inicializacao, `afterEach` para liberar recursos (DB, mensageria)
- Cobertura completa do codigo escrito
