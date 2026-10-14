# Analisador de Documentos Jurídicos
Aplicação web fullstack para cadastro, gerenciamento e análise automática de textos jurídicos fictícios. O sistema permite autenticar usuários, organizar documentos e identificar sua categoria, gerar um resumo e destacar frases que merecem atenção, utilizando **regras determinísticas** por padrão, com opção de **análise contextual via Google Gemini**.

> **Desafio técnico — Trainee Fullstack.** Os textos utilizados são fictícios e têm finalidade exclusivamente demonstrativa. As análises são automatizadas e **não substituem avaliação jurídica profissional**.

## Funcionalidades
- **Usuários:** cadastro com validação de dados, e-mail único sem distinção entre maiúsculas e minúsculas, login com JWT e logout.
- **Documentos:** criação, listagem, visualização, edição e exclusão; ordenação crescente ou decrescente por data e filtro para mostrar apenas os documentos do usuário autenticado.
- **Permissões:** usuários autenticados podem visualizar os documentos; somente o autor pode editar, excluir ou executar a análise de um documento.
- **Análise:** classificação em `contrato`, `peticao`, `decisao`, `notificacao` ou `outro`; resumo limitado a 300 caracteres e lista de pontos de atenção.
- **IA opcional:** análise contextual com Google Gemini, com o mesmo formato de resposta e sem alterar os endpoints.
- **Persistência:** usuários, documentos e análises armazenados em PostgreSQL, com migrations gerenciadas pelo Prisma.
- **Interface:** páginas responsivas, mensagens de erro, estados de carregamento e confirmação antes da exclusão.
- **Testes:** testes automatizados do analisador usando os seis exemplos fornecidos no desafio, além de testes de integração da API com banco PostgreSQL separado.

## Tecnologias
| Camada | Tecnologias |
| --- | --- |
| Front-end | React, TypeScript, Vite, React Router, Axios, CSS |
| Back-end | Node.js, TypeScript, Express, Zod |
| Autenticação | JWT (`jsonwebtoken`) e `bcryptjs` |
| Banco de dados | PostgreSQL e Prisma ORM |
| IA opcional | Google Gemini (`@google/genai`), respostas estruturadas e Zod |
| Testes | Vitest e Supertest |
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
│   │   └── api/                # Testes de integração com Supertest
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/              # Cadastro, login e telas de documentos
│   │   ├── services/api.ts     # Cliente HTTP com token JWT
│   │   └── App.tsx             # Rotas e proteção de páginas
│   └── .env.example
├── exemplos/                   # Seis entradas e saídas esperadas do desafio
└── README.md
```

## Como executar localmente
### 1. Pré-requisitos
- **Node.js 22.12 ou superior**, com npm disponível (uma versão LTS recente é recomendada).
- **PostgreSQL** instalado e em execução (desenvolvimento realizado com PostgreSQL 17).
- **Git** e um editor, como VS Code.
- Acesso a um usuário PostgreSQL autorizado a criar bancos e aplicar migrations.

Confira a instalação:

```bash
node --version
npm --version
```

### 2. Clonar o repositório
```bash
git clone https://github.com/vitorxxd3/Desafio-Trainee-Fullstack.git
cd Desafio-Trainee-Fullstack
```

> A implementação está na branch `feat/estrutura-inicial` enquanto o Pull Request não for integrado à `main`. Nesse período, execute `git switch feat/estrutura-inicial` após clonar.

### 3. Criar o banco de dados
No **pgAdmin**, conecte-se ao PostgreSQL e crie um banco chamado `analisador_documentos` em **Databases → Create → Database**.

Como alternativa, em um editor SQL conectado ao banco administrativo `postgres`, execute:

```sql
CREATE DATABASE analisador_documentos;
```

Não é necessário criar as tabelas manualmente: elas serão geradas pelas migrations.

### 4. Configurar e iniciar o back-end
Em um terminal, acesse a pasta `backend`:

```bash
cd backend
npm ci
```

Crie um arquivo **`backend/.env`** com base em `backend/.env.example`. No PowerShell (Windows):

```powershell
Copy-Item .env.example .env
```

No macOS/Linux:

```bash
cp .env.example .env
```

Exemplo do conteúdo, substituindo os valores ilustrativos pelas suas configurações locais:

```dotenv
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/analisador_documentos?schema=public"
PORT=3001
JWT_SECRET="DEFINA_UMA_CHAVE_SECRETA_LONGA_E_ALEATORIA"
ANALISADOR=regras
GEMINI_API_KEY=
GEMINI_MODELO=gemini-3.1-flash-lite
```

O Gemini é **opcional**. Para reproduzir o desafio sem serviços externos, deixe `ANALISADOR=regras` e `GEMINI_API_KEY` vazio.

**Atenção:** `SUA_SENHA` é apenas um marcador. Se sua senha tiver caracteres especiais, eles precisam estar corretamente codificados na URL de conexão. Nunca publique o `.env` nem o segredo JWT.

Gere o cliente Prisma, aplique as migrations e inicie a API:

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

A API ficará disponível em **`http://localhost:3001`**. Para verificar:

```text
GET http://localhost:3001/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "mensagem": "API rodando com sucesso"
}
```

> Para compilar e iniciar a versão compilada, use `npm run build` e `npm start` na pasta `backend`.

### 5. Configurar e iniciar o front-end
**Mantenha o back-end em execução.** Abra outro terminal, a partir da raiz do repositório:

```bash
cd frontend
npm ci
```

Crie `frontend/.env` com base no `.env.example`:

```dotenv
VITE_API_URL=http://localhost:3001
```

Esse valor é o endereço público da API local; não coloque segredos em variáveis iniciadas por `VITE_`.

Inicie a interface:

```bash
npm run dev
```

Abra **`http://localhost:5173`** no navegador (ou a porta exibida pelo Vite). Cadastre um usuário fictício, faça login e crie um documento para testar o fluxo.

Para conferir a versão de produção do front-end:

```bash
npm run build
npm run lint
```

## Fluxo de utilização
1. Acesse **Cadastro** e crie uma conta de teste usando dados fictícios.
2. Faça **Login** com o e-mail e a senha cadastrados.
3. Na lista de documentos, use **Novo documento** para informar título e conteúdo.
4. Selecione o título de um documento para visualizar seus detalhes.
5. Se você for o autor, utilize **Analisar documento** para gerar e armazenar classificação, resumo e pontos de atenção.
6. Se necessário, **edite** ou **exclua** seu documento. Alterar apenas o título mantém a análise; modificar o conteúdo remove a análise anterior e permite gerar outra.
7. Utilize **Ordenar por**, **Mostrar apenas meus documentos** e **Sair** conforme necessário.

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
| `GET` | `/documentos?ordem=desc&meus=false` | Listar, ordenar e filtrar documentos | `200` |
| `POST` | `/documentos` | Criar documento | `201` |
| `GET` | `/documentos/:id` | Consultar detalhes e análise | `200` |
| `PUT` | `/documentos/:id` | Atualizar título e conteúdo | `200` |
| `DELETE` | `/documentos/:id` | Excluir documento | `204` |
| `POST` | `/documentos/:id/analise` | Gerar ou substituir análise | `201` |

Os endpoints `/documentos` exigem autenticação. Edição, exclusão e análise exigem que o usuário seja o autor do documento.

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

O glossário fica em `backend/src/analyzers/glossario.ts`. A fábrica de analisadores lê `ANALISADOR` (valores suportados: `regras` e `gemini`). A análise é armazenada com tipo, resumo, pontos de atenção, identificador do analisador e data. Uma nova execução substitui a análise anterior.

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

## Testes de interface

Além dos testes unitários do analisador e testes de integração da API com PostgreSQL isolado, a interface possui testes com **React Testing Library, Vitest e jsdom**. Os testes verificam o preenchimento do formulário após importar um arquivo, a rejeição de arquivos maiores que o limite e a renderização de históricos de documentos excluídos.

Na pasta `frontend`, execute:

```bash
npm test
npm run build
npm run lint
```

**Primeira instalação:** atualize as dependências conforme as instruções do pacote e execute `npx prisma migrate deploy` e `npx prisma generate` no `backend` antes de iniciar os serviços.

## Testes automatizados
Os testes são executados a partir da pasta `backend`.

### Testes obrigatórios do analisador
```bash
cd backend
npm test
```

Os **6 casos obrigatórios** leem diretamente `exemplos/01` a `exemplos/06` e verificam igualdade exata com cada `.esperado.json`, sem duplicar os textos no código dos testes.

### Testes de integração da API
Para proteger os dados de desenvolvimento, utilize **outro banco PostgreSQL**, chamado `analisador_documentos_teste`.

1. Crie o banco `analisador_documentos_teste` no pgAdmin (ou usando `CREATE DATABASE analisador_documentos_teste;` conectado ao banco administrativo).
2. Na pasta `backend`, crie o arquivo **`.env.test`** com configurações exclusivas para testes:

   ```dotenv
   DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/analisador_documentos_teste?schema=public"
   PORT=3001
   JWT_SECRET="CHAVE_FICTICIA_EXCLUSIVA_PARA_TESTES"
   ANALISADOR=regras
   ```

3. Com o terminal na pasta `backend`, execute:

   ```bash
   npx dotenv -e .env.test -- prisma migrate deploy
   npm run test:api
   ```

O comando `test:api` usa a configuração `vitest.api.config.ts`, que confere se a URL termina no banco esperado antes da execução. **Não utilize o banco principal para os testes de integração.**

Os **11 testes de integração existentes** cobrem cadastro e e-mail duplicado, login e senha incorreta, autenticação obrigatória, criação e preservação do texto, validações, permissões, invalidação da análise após alteração, filtros e exclusão. A ordenação válida `asc`/`desc` foi verificada no fluxo da interface, mas ainda pode receber uma asserção automatizada específica.

Para validar a compilação do back-end:

```bash
npm run build
```

Para validar o front-end, em outro terminal:

```bash
cd frontend
npm run build
npm run lint
```

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
