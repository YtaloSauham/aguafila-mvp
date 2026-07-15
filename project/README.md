# Sistema de Gerenciamento de Atendimento — Abastecimento de Água (MVP)

Sistema de gerenciamento de filas para uma empresa de abastecimento de água,
substituindo o processo manual por um fluxo informatizado: emissão de senhas,
chamada por esteira, painel público em tempo real e áudio de chamada.

Todo o sistema roda **100% em rede local**, sem depender de internet
(exceto o carregamento inicial das fontes web, que podem ser removidas
das páginas HTML se o ambiente for totalmente offline — veja `docs/INSTALACAO.md`).

## Stack

| Camada        | Tecnologia                              |
|---------------|------------------------------------------|
| Frontend      | HTML5, CSS3, JavaScript ES6 (vanilla)     |
| Backend       | Node.js + Express                         |
| Banco de dados| MariaDB                                   |
| Tempo real    | Socket.IO                                 |
| Comunicação   | REST API (JSON)                           |

Nenhum framework de frontend (React/Vue/Angular) é utilizado, conforme especificação.

## Estrutura do projeto

```
project/
├── backend/
│   ├── config/          # env.js, database.js (pool MariaDB)
│   ├── controllers/     # camada HTTP (entrada/saída)
│   ├── services/        # regras de negócio (RN001-RN013)
│   ├── repositories/    # acesso a dados (SQL puro)
│   ├── routes/          # definição das rotas REST
│   ├── middlewares/     # validação, log, tratamento de erros
│   ├── realtime/        # Socket.IO (eventos em tempo real)
│   ├── database/        # scripts de migration/seed via Node
│   ├── utils/           # logger, AppError, asyncHandler, transações
│   ├── app.js            # configuração do Express
│   └── server.js         # ponto de entrada
├── frontend/
│   ├── terminal/          # Terminal de Autoatendimento
│   ├── operador/          # Painel do Operador
│   ├── painel/             # Painel Público (TV/monitor)
│   └── assets/             # CSS/JS/áudio compartilhados
├── sql/
│   ├── schema.sql          # criação das tabelas
│   └── seed.sql             # dados iniciais (esteiras + configuração)
└── docs/
    ├── API.md
    └── INSTALACAO.md
```

## Arquitetura em camadas

```
Cliente → Frontend → Controllers → Services → Repositories → MariaDB
```

Cada camada tem responsabilidade única. **Nenhuma regra de negócio existe
nas rotas** — toda regra está nos `services/`, seguindo Clean Code, SOLID,
Repository Pattern e Service Layer (seção 15 da especificação).

## Início rápido

Veja o passo a passo completo em [`docs/INSTALACAO.md`](docs/INSTALACAO.md).

```bash
# 1. Banco de dados (Máquina servidor)
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/seed.sql

# 2. Backend (Máquina servidor)
cd backend
cp .env.example .env   # ajuste HOST, DB_HOST, CORS_ORIGIN conforme necessário
npm install
npm start

# 3. Acesse localmente (Máquina servidor)
# Terminal:  http://localhost:3000/terminal
# Operador:  http://localhost:3000/operador
# Painel:    http://localhost:3000/painel

# 4. Acesse remotamente (Máquinas clientes)
# Substitua 192.168.1.100 pelo IP da máquina servidor
# Terminal:  http://192.168.1.100:3000/terminal
# Operador:  http://192.168.1.100:3000/operador
# Painel:    http://192.168.1.100:3000/painel
```

## Documentação

- [`docs/API.md`](docs/API.md) — Referência completa da API REST e eventos Socket.IO.
- [`docs/INSTALACAO.md`](docs/INSTALACAO.md) — Instalação, configuração e execução em rede local.

## Fluxo de atendimento

1. Motorista chega e usa o **Terminal** → "Retirar Senha".
2. Sistema gera, salva e imprime a senha (impressão via `PrinterService`, camada abstrata).
3. Motorista descarrega os galões e aguarda no pátio.
4. **Operador** visualiza a fila e, quando uma esteira estiver livre, chama a próxima senha.
5. **Painel Público** exibe a senha chamada e o sistema reproduz o áudio: *"Senha A023, dirigir-se à Esteira 2."*
6. Operador finaliza o atendimento → senha `FINALIZADA`, esteira volta a `LIVRE`.

## Escopo do MVP

**Incluído:** emissão de senha, impressão térmica (abstrata), fila única, chamada de senha,
direcionamento por esteira, áudio de chamada, painel público em tempo real, controle de estado das esteiras.

**Fora do escopo do MVP** (ver seção 17 da especificação para evolução planejada):
cadastro de clientes, login/autenticação, histórico de atendimentos, relatórios,
dashboard administrativo, múltiplos operadores simultâneos.

## Regras de negócio implementadas

| Código | Regra |
|--------|-------|
| RN001 | Existe apenas uma fila. |
| RN002 | As senhas são sequenciais. |
| RN003 | A sequência reinicia diariamente. |
| RN004 | Não pode haver duas senhas iguais no mesmo dia. |
| RN005 | Cada esteira atende apenas uma senha. |
| RN006 | Somente senhas `AGUARDANDO` podem ser chamadas. |
| RN007 | Somente esteiras `LIVRES` podem receber uma chamada. |
| RN008 | Ao chamar: senha → `EM_ATENDIMENTO`, esteira → `OCUPADA`. |
| RN009 | Ao finalizar: senha → `FINALIZADA`, esteira → `LIVRE`. |
| RN010 | Toda chamada gera áudio. |
| RN011 | Toda chamada atualiza o painel instantaneamente. |
| RN012 | O operador pode repetir a chamada. |
| RN013 | O operador pode cancelar uma senha antes do atendimento. |

Todas as regras acima estão implementadas em `backend/services/senhaService.js`,
com transições de estado protegidas por transações de banco de dados
(`backend/utils/withTransaction.js`) para evitar condições de corrida
(ex.: duas chamadas simultâneas para a mesma esteira).
