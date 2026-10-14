# Analisador de Documentos Jurídicos
Aplicação web fullstack para cadastro, gerenciamento e análise automática de textos jurídicos fictícios. O sistema permite autenticar usuários, organizar documentos e identificar sua categoria, gerar um resumo e destacar frases que merecem atenção, utilizando **regras determinísticas** por padrão, com opção de **análise contextual via Google Gemini**.

> **Desafio técnico — Trainee Fullstack.** Os textos utilizados são fictícios e têm finalidade exclusivamente demonstrativa. As análises são automatizadas e **não substituem avaliação jurídica profissional**.

## Funcionalidades
- **Autenticação:** cadastro e login com JWT, validação de dados e controle de permissões.
- **Documentos:** criação, listagem, edição, exclusão, ordenação, filtro por autor, **busca por título e paginação**.
- **Importação:** extração de texto de arquivos `.txt` e `.pdf` antes de salvar o documento.
- **Análise:** classificação, resumo de até 300 caracteres e pontos de atenção; modo determinístico por regras ou **Google Gemini opcional**.
- **Histórico:** versões anteriores arquivadas em PostgreSQL, consultáveis mesmo após alteração do texto ou exclusão do documento.
- **Interface:** páginas responsivas, estados de carregamento, validações e mensagens de erro.
- **Testes:** casos oficiais do analisador, integração da API com banco separado e React Testing Library.

## Tecnologias
| Camada | Tecnologias |
| --- | --- |
| Front-end | React, TypeScript, Vite, React Router, Axios, CSS |
| Back-end | Node.js, TypeScript, Express, Zod, Multer e pdf-parse |
| Autenticação | JWT (`jsonwebtoken`) e `bcryptjs` |
| Banco de dados | PostgreSQL e Prisma ORM |
| IA opcional | Google Gemini (`@google/genai`), respostas estruturadas e Zod |
| Testes | Vitest, Supertest, React Testing Library e jsdom |
| Qualidade | ESLint (front-end), TypeScript e Git |

## Estrutura do projeto
```text
.
├── backend/
│   ├── prisma/
│   │   ├── migrations/          # Criação e evolução das tabelas
│   │   └── schema.prisma        # Modelos de dados
│   ├── src/
│   │   ├── analyzers/           # Interface, glossário e analisadores
│   │   ├── controllers/         # Tratamento das requisições e respostas
│   │   ├── middlewares/         # Validação do token JWT
│   │   ├── routes/              # Rotas da API
│   │   ├── schemas/             # Validações com Zod
│   │   ├── services/            # Regras de negócio e acesso ao Prisma
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── analisador-regras.test.ts
│   │   ├── analisador-gemini.test.ts
│   │   └── api/                # Testes de integração com Supertest
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/              # Telas e testes do front-end
│   │   ├── services/api.ts     # Cliente HTTP com token JWT
│   │   └── App.tsx             # Rotas e proteção de páginas
│   ├── vitest.config.ts
│   └── .env.example
├── exemplos/                   # Seis entradas e saídas esperadas do desafio
└── README.md
```

## Como executar o projeto

> **Execução local, sem Docker.** O projeto possui duas aplicações independentes (`backend` e `frontend`) e utiliza PostgreSQL. Na primeira execução, prepare o banco de dados e instale as dependências; nas próximas, basta iniciar os dois servidores.

### Pré-requisitos

- **Node.js 22.12 ou superior**, npm e Git.
- **PostgreSQL** instalado e em execução (testado com PostgreSQL 17).
- Um usuário PostgreSQL com permissão para criar os bancos e aplicar as migrations.

Confira o Node.js e o npm com `node --version` e `npm --version`.

### 1. Clonar o repositório

A implementação está na branch `feat/estrutura-inicial`. Execute no terminal:

```bash
git clone --branch feat/estrutura-inicial https://github.com/vitorxxd3/Desafio-Trainee-Fullstack.git
cd Desafio-Trainee-Fullstack
```

### 2. Criar o banco de dados

No **pgAdmin**, conecte-se ao PostgreSQL, clique em **Databases → Create → Database** e crie o banco `analisador_documentos`.

Também é possível executar no editor SQL conectado ao banco administrativo `postgres`:

```sql
CREATE DATABASE analisador_documentos;
```

**Crie somente o banco.** As tabelas de usuários, documentos, análises e histórico serão criadas automaticamente pelas migrations do Prisma.

### 3. Preparar e iniciar o back-end — Terminal 1

A partir da pasta raiz do repositório:

```bash
cd backend
npm ci
```

Crie o arquivo privado `backend/.env` a partir do exemplo. **Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:** `cp .env.example .env`.

Edite `backend/.env` com os dados da sua instalação:

```dotenv
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/analisador_documentos?schema=public"
PORT=3001
JWT_SECRET="SUBSTITUA_POR_UMA_CHAVE_LONGA_E_ALEATORIA"
ANALISADOR=regras
GEMINI_API_KEY=
GEMINI_MODELO=gemini-3.1-flash-lite
```

Substitua `SUA_SENHA` pela senha do PostgreSQL e defina um `JWT_SECRET` próprio. Caso a senha contenha caracteres especiais, codifique-os corretamente na URL. **Para rodar o desafio, não é necessária uma chave Gemini:** `ANALISADOR=regras` funciona sem acesso a serviços externos.

Ainda na pasta `backend`, execute na ordem:

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

`prisma generate` gera o cliente de acesso ao banco; `migrate deploy` aplica as migrations existentes **sem precisar criar as tabelas manualmente**; `npm run dev` inicia a API.

**API:** http://localhost:3001 — **Verificação:** [http://localhost:3001/health](http://localhost:3001/health). A resposta esperada é `{"status":"ok","mensagem":"API rodando com sucesso"}`.

### 4. Preparar e iniciar o front-end — Terminal 2

**Mantenha o Terminal 1 aberto.** Abra um segundo terminal **na raiz do repositório** e execute:

```bash
cd frontend
npm ci
```

Crie o arquivo privado `frontend/.env`. **Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:** `cp .env.example .env`.

Confira o valor no `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:3001
```

Inicie a interface:

```bash
npm run dev
```

Abra **http://localhost:5173** (ou a porta informada pelo Vite), cadastre uma conta fictícia e faça login. Você poderá criar documentos, importar TXT/PDF, analisar, pesquisar e consultar o histórico.

### Próximas execuções e Gemini (opcional)

Depois da configuração inicial, não é necessário repetir `npm ci` nem as migrations a cada inicialização: com o PostgreSQL em execução, use `npm run dev` em `backend` e em `frontend`, cada um em seu próprio terminal. **Ao baixar novas migrations**, execute `npx prisma migrate deploy` no `backend`.

Para ativar a análise com IA, altere **somente o `backend/.env`** para `ANALISADOR=gemini`, informe `GEMINI_API_KEY` e mantenha `GEMINI_MODELO=gemini-3.1-flash-lite`. Reinicie o back-end. A chave é opcional, privada e nunca deve ir para o front-end ou GitHub. Os testes oficiais continuam usando o analisador por regras.

## Como executar os testes

Os comandos abaixo devem ser executados **nas pastas indicadas**. Os testes unitários e de interface não precisam de chave Gemini; os testes de integração usam um banco PostgreSQL **exclusivo para testes**.

### 1. Testes unitários do back-end (Vitest)

Na raiz do repositório:

```bash
cd backend
npm test
```

Verificam o analisador por regras contra os **seis arquivos oficiais** de `exemplos/` (incluindo casos Unicode), além da integração Gemini simulada, sem chamadas reais à API externa. O comando não executa os testes de integração com banco.

### 2. Testes do front-end (Vitest + React Testing Library)

Abra outro terminal **na raiz do repositório**:

```bash
cd frontend
npm test
```

Validam interações do formulário (incluindo importação e limites de arquivo) e a exibição do histórico. **Não é preciso iniciar o servidor Vite para rodar esses testes.**

### 3. Testes de integração da API (Supertest + PostgreSQL)

**Antes de executar, prepare o banco de testes separado.** No pgAdmin, crie `analisador_documentos_teste` ou execute no banco administrativo `postgres`:

```sql
CREATE DATABASE analisador_documentos_teste;
```

Na pasta `backend`, crie **`backend/.env.test`** copiando `.env.example` e altere-o para usar **somente o banco de testes**:

```dotenv
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/analisador_documentos_teste?schema=public"
PORT=3001
JWT_SECRET="CHAVE_ALEATORIA_EXCLUSIVA_PARA_TESTES"
ANALISADOR=regras
GEMINI_API_KEY=
GEMINI_MODELO=gemini-3.1-flash-lite
```

Com o terminal **dentro de `backend`**, execute:

```bash
npx dotenv -e .env.test -- prisma migrate deploy
npm run test:api
```

O primeiro comando cria/atualiza as tabelas **no banco de testes**; o segundo executa as requisições automatizadas de integração. A configuração `vitest.api.config.ts` verifica se o banco é `analisador_documentos_teste` para reduzir o risco de executar testes destrutivos no banco principal. **Nunca aponte `.env.test` para `analisador_documentos`.**

Esses testes cobrem os endpoints da API, autenticação, permissões, CRUD, filtros/paginação e funcionalidades adicionais como histórico e importação de arquivos.

### 4. Verificar compilação e qualidade do código

Os comandos abaixo também devem terminar sem erros. Execute-os nas respectivas pastas:

| Pasta | Comando | Finalidade |
| --- | --- | --- |
| `backend` | `npm run build` | Compilar o TypeScript do servidor |
| `frontend` | `npm run build` | Verificar os tipos e gerar a versão de produção |
| `frontend` | `npm run lint` | Verificar regras do ESLint |

> **Dica:** `npm ci` instala as versões registradas nos arquivos `package-lock.json`. Se ocorrer erro de resolução de dependências do React Testing Library em alguma versão do npm, tente `npm ci --legacy-peer-deps` **somente na pasta `frontend`**.

## Fluxo de utilização
1. Acesse **Cadastro** e crie uma conta de teste usando dados fictícios.
2. Faça **Login** com o e-mail e a senha cadastrados.
3. Na lista de documentos, use **Novo documento** para informar título e conteúdo.
4. Selecione o título de um documento para visualizar seus detalhes.
5. Se você for o autor, utilize **Analisar documento** para gerar e armazenar classificação, resumo e pontos de atenção. É possível importar um TXT/PDF antes de salvar.
6. Se necessário, **edite** ou **exclua** seu documento. Alterar apenas o título mantém a análise vigente; modificar o conteúdo arquiva a anterior no histórico.
7. Utilize **Buscar por título**, **Paginação**, **Ordenar por**, **Mostrar apenas meus documentos**, **Consultar histórico** e **Sair** conforme necessário.

## Endpoints da API
**URL base:** `http://localhost:3001`

**Formato:** JSON (`Content-Type: application/json`).

Nas rotas protegidas, informe:

```http
Authorization: Bearer SEU_TOKEN_JWT
```

| Método | Endpoint | Descrição | Sucesso |
| --- | --- | --- | --- |
| `GET` | `/health` | Verificar a API | `200` |
| `POST` | `/auth/cadastro` | Cadastrar usuário | `201` |
| `POST` | `/auth/login` | Autenticar usuário | `200` |
| `GET` | `/documentos?busca=contrato&pagina=1&limite=10&ordem=desc&meus=false` | Buscar, filtrar e paginar documentos | `200` |
| `POST` | `/documentos` | Criar documento | `201` |
| `GET` | `/documentos/:id` | Consultar detalhes e análise | `200` |
| `PUT` | `/documentos/:id` | Atualizar título e conteúdo | `200` |
| `DELETE` | `/documentos/:id` | Excluir documento | `204` |
| `POST` | `/documentos/:id/analise` | Gerar ou substituir análise | `201` |
| `POST` | `/documentos/extrair-texto` | Extrair texto de TXT/PDF (`multipart/form-data`) | `200` |
| `GET` | `/documentos/:id/historico` | Consultar histórico do próprio documento | `200` |
| `GET` | `/historico-analises` | Consultar histórico de análises do usuário | `200` |

Todas as rotas de documentos e histórico exigem autenticação. Edição, exclusão, análise e consulta do histórico de um documento exigem que o usuário seja seu autor.

### Exemplos de requisições e respostas
**Cadastro — `POST /auth/cadastro`**

```json
{
  "nome": "Usuário Exemplo",
  "email": "usuario@exemplo.com",
  "senha": "SenhaFicticia123"
}
```

**Resposta `201`:**

```json
{
  "id": 1,
  "nome": "Usuário Exemplo",
  "email": "usuario@exemplo.com"
}
```

**Login — `POST /auth/login`**

```json
{
  "email": "usuario@exemplo.com",
  "senha": "SenhaFicticia123"
}
```

**Resposta `200` (token ilustrativo):**

```json
{
  "token": "TOKEN_JWT_GERADO_PELA_API",
  "usuario": {
    "id": 1,
    "nome": "Usuário Exemplo",
    "email": "usuario@exemplo.com"
  }
}
```

**Criação — `POST /documentos`**

```json
{
  "titulo": "Contrato fictício de prestação de serviços",
  "conteudo": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nO prazo de vigência é de 12 meses.\nEm caso de rescisão, haverá multa contratual."
}
```

**Resposta `201` (IDs e datas ilustrativos):**

```json
{
  "id": 7,
  "titulo": "Contrato fictício de prestação de serviços",
  "conteudo": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nO prazo de vigência é de 12 meses.\nEm caso de rescisão, haverá multa contratual.",
  "autor": { "id": 1, "nome": "Usuário Exemplo" },
  "criado_em": "2026-10-09T12:00:00.000Z",
  "atualizado_em": "2026-10-09T12:00:00.000Z",
  "analise": null
}
```

**Listagem — `GET /documentos?ordem=desc&meus=true`**

- `ordem`: `desc` (padrão) ou `asc`, pela data de criação.
- `meus`: `false` (padrão) ou `true`.
- `busca`: pesquisa parcial e sem distinção entre maiúsculas e minúsculas no título.
- `pagina`: número da página (começa em `1`); `limite`: registros por página (máximo `100`).
- Sem `pagina`/`limite`, a API mantém o array original; com paginação, retorna `{ "dados": [...], "paginacao": { "pagina": 1, "limite": 10, "total": 1, "total_paginas": 1 } }`.
- Valores diferentes dos permitidos retornam `400`.

**Resposta `200` (exemplo):**

```json
[
  {
    "id": 7,
    "titulo": "Contrato fictício de prestação de serviços",
    "autor": { "id": 1, "nome": "Usuário Exemplo" },
    "criado_em": "2026-10-09T12:00:00.000Z",
    "tipo": "contrato"
  }
]
```

**Atualização — `PUT /documentos/7`**

O corpo **deve conter sempre** os dois campos:

```json
{
  "titulo": "Contrato fictício revisado",
  "conteudo": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nO prazo de vigência é de 12 meses.\nEm caso de rescisão, haverá multa contratual."
}
```

A resposta `200` tem o mesmo formato da consulta detalhada `GET /documentos/:id`. O texto é persistido sem aplicar `trim()` ou modificar seus espaços e quebras de linha.

**Análise — `POST /documentos/7/analise`**

Sem corpo de requisição; o serviço analisa o **conteúdo salvo** no banco, não o título. Resposta `201` (data ilustrativa):

```json
{
  "tipo": "contrato",
  "resumo": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS O prazo de vigência é de 12 meses.",
  "pontos_de_atencao": [
    "O prazo de vigência é de 12 meses.",
    "Em caso de rescisão, haverá multa contratual."
  ],
  "analisador": "regras",
  "criado_em": "2026-10-09T12:01:00.000Z"
}
```

> `GET /documentos/:id` retorna os dados completos e a propriedade `analise` (objeto acima ou `null`). `DELETE /documentos/:id` não retorna corpo e utiliza `204 No Content`.

### Validação e erros
| HTTP | Código `erro` | Significado |
| --- | --- | --- |
| `400` | `VALIDACAO` | Dados ou parâmetros inválidos |
| `401` | `NAO_AUTENTICADO` | Ausência de token, token inválido ou credenciais incorretas |
| `403` | `SEM_PERMISSAO` | Usuário não é o autor do documento |
| `404` | `NAO_ENCONTRADO` | Documento inexistente |
| `409` | `CONFLITO` | E-mail já cadastrado |

Exemplo de resposta de erro:

```json
{
  "erro": "SEM_PERMISSAO",
  "mensagem": "Você não tem permissão para modificar este documento."
}
```

As senhas não são retornadas pela API. Os documentos rejeitam título vazio ou apenas com espaços, títulos acima de 200 caracteres, conteúdo vazio ou apenas com espaços e conteúdo acima de 50.000 caracteres. As datas de resposta são representadas no padrão ISO 8601.

## Analisador por regras
A implementação utilizada é `AnalisadorRegras`, isolada por uma interface com o contrato `analisar(conteudo) → { tipo, resumo, pontos_de_atencao }`.

O processo segue as regras definidas no desafio:

1. **Preparação:** normalização Unicode NFC e padronização de quebras de linha, exclusivamente para análise.
2. **Divisão em frases:** separação por linha e por `.`, `!` ou `?` seguidos de espaços; remoção de espaços excedentes dentro de cada frase.
3. **Classificação:** contagem de termos distintos do glossário, desconsiderando acentos e diferenças de maiúsculas/minúsculas, com correspondência de termos inteiros. Empates priorizam `decisao`, `peticao`, `notificacao` e `contrato`, nessa ordem.
4. **Resumo:** concatenação das duas primeiras frases, truncada em 300 caracteres Unicode quando necessário.
5. **Pontos de atenção:** frases que contenham termos como `multa`, `prazo`, `juros`, `rescisão` e `honorários`, sem duplicação de frases idênticas.

O glossário fica em `backend/src/analyzers/glossario.ts`. A fábrica de analisadores lê `ANALISADOR` (valores suportados: `regras` e `gemini`). A análise é armazenada com tipo, resumo, pontos de atenção, identificador do analisador e data. Uma nova execução substitui a análise vigente, arquivando a versão anterior no histórico.

### Avaliação crítica dos exemplos oficiais
| Exemplo | Resultado das regras | Acertos e limitações observadas |
| --- | --- | --- |
| **01 — Contrato de locação** | `contrato` | Identifica corretamente o tipo e destaca prazo, multa, juros e rescisão. O resumo é apenas o início do contrato, sem necessariamente sintetizar suas obrigações mais relevantes. |
| **02 — Petição de indenização** | `peticao` | Identifica termos próprios de petições e sinaliza prazo, indenização, juros e honorários. O resumo é truncado e dedica espaço ao endereçamento e à identificação das partes, em vez de priorizar pedido e fundamentos. |
| **03 — Sentença de cobrança** | `decisao` | Classifica a sentença e destaca prazo, condenação com juros e honorários. O resumo contém somente o cabeçalho do Poder Judiciário e da vara, deixando de mencionar o resultado da decisão. |
| **04 — Notificação de aluguel** | `notificacao` | Detecta o tipo e ressalta prazo de pagamento, multa, juros, despejo e indenização. O resumo contém o título e a identificação do notificante, mas não comunica a providência principal exigida. |
| **05 — Procuração** | `outro` | Retorna corretamente `outro` por não encontrar termos dos quatro tipos configurados e não indica pontos de atenção. A classificação é limitada ao glossário; não existe uma categoria específica para procurações. |

O **exemplo 06** verifica casos de borda, como Unicode NFC/NFD, caracteres de espaço especiais, quebras de linha CRLF/CR e contagem de caracteres com emojis. Seu resultado também é comparado automaticamente ao arquivo `.esperado.json` correspondente.

**Como a implementação opcional com IA pode complementar as regras:** um modelo de linguagem poderia interpretar o significado integral do documento para produzir um resumo centrado em fatos, pedidos, decisões, obrigações, valores e prazos — por exemplo, resumindo a conclusão da sentença do exemplo 03, e não somente seu cabeçalho. Também poderia contextualizar os riscos identificados. Nesta entrega, as regras determinísticas permanecem como padrão para reproduzir os seis resultados oficiais. A implementação opcional com Gemini utiliza uma resposta estruturada, validação no servidor e tratamento de falhas externas, mas suas análises dependem do modelo e devem ser revisadas por uma pessoa.

## Diferencial opcional: analisador com IA (Gemini)
Além do analisador obrigatório por regras, a aplicação oferece uma implementação intercambiável usando a API Google Gemini. Não há mudanças nas rotas, no banco ou no front-end: `POST /documentos/:id/analise` mantém o mesmo contrato (`tipo`, `resumo`, `pontos_de_atencao`, `analisador`, `criado_em`).

- `ANALISADOR=regras` (padrão): análise determinística e testes dos seis exemplos oficiais, sem conexão externa ou chave.
- `ANALISADOR=gemini`: análise contextual pela API Gemini, com `GEMINI_MODELO=gemini-3.1-flash-lite` (modelo configurável).

Para usar a opção com IA, obtenha uma chave no [Google AI Studio](https://aistudio.google.com/apikey) e preencha **apenas** o arquivo privado `backend/.env`:

```dotenv
ANALISADOR=gemini
GEMINI_API_KEY=SUA_CHAVE_REAL_PRIVADA
GEMINI_MODELO=gemini-3.1-flash-lite
```

Após salvar, reinicie o back-end e analise um documento fictício normalmente na interface. **A chave nunca deve ser colocada no front-end, no `.env.example`, em commits, nos exemplos do projeto ou enviada a terceiros.** O uso da API pode estar sujeito a cotas e cobrança conforme o projeto do Google Cloud.

### Validação e tolerância a falhas
O provedor recebe somente o conteúdo do documento. A resposta é solicitada em JSON estruturado e validada novamente no servidor com Zod: classificação limitada aos cinco tipos permitidos, resumo com no máximo 300 caracteres Unicode e até 20 pontos de atenção; cada ponto deve corresponder a um trecho literal do documento. Respostas inválidas ou inventadas são rejeitadas **antes de gravar no banco**.

A integração configura um timeout de 20 segundos e transforma falhas externas em erros JSON seguros: autenticação inválida (`502`), limite de uso ou indisponibilidade (`503`) e timeout (`504`), sem retornar a chave. A análise existente não é substituída quando o provedor falha.

Os testes de IA usam a API simulada, sem rede ou credenciais. Execute `npm test` na pasta `backend` para rodar os testes unitários, inclusive os seis exemplos oficiais; para os testes de integração da API, use `ANALISADOR=regras` no banco de testes e `npm run test:api`.

**Limitações:** modelos de linguagem podem variar na interpretação e não substituem revisão humana. A opção com IA depende de conexão, cotas e credenciais válidas. Utilize somente documentos fictícios; dados enviados à API externa estão sujeitos às políticas de tratamento de dados do provedor.

## Histórico de análises

O sistema conserva a análise vigente em `analises` e arquiva a versão anterior em `historico_analises`, dentro da **mesma transação PostgreSQL**, em três situações:

- `SUBSTITUIDA`: uma nova análise foi gerada (por regras ou Gemini);
- `CONTEUDO_ALTERADO`: o texto do documento foi editado;
- `DOCUMENTO_EXCLUIDO`: o documento foi excluído pelo autor.

Cada registro guarda o título e ID original, classificação, resumo, pontos de atenção, analisador, data da análise e data do arquivamento. O histórico não possui chave estrangeira para o documento, portanto continua consultável após a exclusão. Usuários só podem consultar o histórico dos documentos que criaram.

- `GET /historico-analises`: até 100 análises arquivadas do usuário autenticado, por data decrescente.
- `GET /documentos/:id/historico`: até 100 análises arquivadas do documento; exige ser seu autor e que o documento ainda exista.

A interface possui **Consultar histórico de análises**, acessível na lista de documentos e na página de detalhes do documento.

## Importação de arquivo `.txt` e `.pdf`

No formulário de criação ou edição, use **Importar arquivo (.txt ou .pdf)**. A API recebe `multipart/form-data` no endpoint protegido `POST /documentos/extrair-texto`, com o campo `arquivo`. Ela lê o arquivo em memória e responde `{ "conteudo": "texto extraído" }`, sem salvar o arquivo no servidor ou criar automaticamente o documento. O usuário deve conferir e clicar em **Salvar documento**.

- Tamanho máximo de 5 MB; texto extraído até 50.000 caracteres Unicode.
- TXT deve estar em UTF-8; PDFs devem conter texto selecionável, não apenas imagens digitalizadas.
- PDF protegido, corrompido ou sem texto retorna erro informativo; imagens digitalizadas exigiriam OCR, não incluído.
- O processamento é local ao back-end; **somente ao clicar em Analisar** é que o texto será enviado ao Gemini, se esse analisador estiver ativado.
- Para extrair PDFs usa-se a biblioteca `pdf-parse` v2 (`PDFParse#getText()`).

## Decisões técnicas
- **React + Vite + TypeScript:** interface modular e desenvolvimento rápido, com verificação de tipos na compilação.
- **Express:** API REST simples e compatível com a estrutura proposta no desafio.
- **Zod:** validação declarativa das entradas da API, garantindo os limites definidos no enunciado.
- **Prisma + PostgreSQL:** modelagem relacional, migrations reproduzíveis e operações transacionais para atualização/exclusão.
- **JWT + bcryptjs:** autenticação sem sessão no servidor e armazenamento de senhas por hash; autorização aplicada no back-end, independentemente dos botões exibidos na interface.
- **Analisador isolado por interface/fábrica:** separa a lógica de interpretação dos documentos das rotas, facilitando a evolução futura.
- **Vitest + Supertest:** verificações reproduzíveis de regras determinísticas e dos fluxos relevantes da API.

## Limitações e melhorias futuras
A proposta prioriza os requisitos obrigatórios e não inclui nesta versão:

- Documentação Swagger e deploy público.
- Pipeline de integração contínua.

Melhorias recomendadas para uma evolução do projeto: tratamento global de token expirado em todas as chamadas da interface; mensagens de acesso negado mais explícitas nos formulários; remoção de arquivos não utilizados do template inicial do Vite; expansão dos testes para verificar a ordem `asc`/`desc` e demais casos extremos; restrição de CORS e reforço de proteções contra abuso para um eventual ambiente de produção. O analisador Gemini adiciona dependência de credenciais, rede e cotas de uso do provedor.

## Segurança e observações
- Utilize **somente documentos e contas fictícios**.
- `backend/.env`, `backend/.env.test` e `frontend/.env` são arquivos locais e devem permanecer fora do controle de versão; os `.env.example` servem de referência.
- O token é transmitido no cabeçalho `Authorization: Bearer` e mantido em `sessionStorage` pela interface durante a sessão da aba. Para uso em produção, o armazenamento de tokens e as proteções contra XSS merecem revisão adicional.
- A análise produzida por regras serve para demonstração técnica e não equivale a interpretação jurídica especializada.

---

**Repositório:** [vitorxxd3/Desafio-Trainee-Fullstack](https://github.com/vitorxxd3/Desafio-Trainee-Fullstack)

**Projeto:** Desafio Técnico — Trainee Fullstack | Analisador de Documentos
