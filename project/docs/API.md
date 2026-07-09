# Referência da API

Base URL: `http://<servidor>:<porta>/api`

Todas as respostas seguem o envelope padrão:

```json
// Sucesso
{ "sucesso": true, "dados": { /* ... */ } }

// Erro
{ "sucesso": false, "erro": { "codigo": "CONFLICT", "mensagem": "..." } }
```

## Senhas

### `POST /api/senhas`
Emite uma nova senha (Terminal de Autoatendimento). Gera número sequencial,
salva no banco e aciona a impressão (RN001-RN004).

**Resposta `201`:**
```json
{
  "sucesso": true,
  "dados": {
    "senha": { "id": 12, "numero": "A012", "status": "AGUARDANDO", "data": "2026-07-08", "hora_emissao": "..." },
    "impressao": { "sucesso": true, "mensagem": "Impresso via driver console (simulação)." }
  }
}
```

### `GET /api/senhas`
Lista as senhas do dia atual. Filtro opcional por status.

Query params: `?status=AGUARDANDO` (ou `CHAMADA`, `EM_ATENDIMENTO`, `FINALIZADA`, `CANCELADA`)

### `GET /api/senhas/:id`
Retorna uma senha específica.

### `PUT /api/senhas/:id/chamar`
Chama a senha `:id` para uma esteira livre (RN006, RN007, RN008).

**Body:**
```json
{ "esteiraId": 1 }
```

**Erros possíveis:** `409 CONFLICT` se a senha não estiver `AGUARDANDO` ou a esteira não estiver `LIVRE`.

### `PUT /api/senhas/:id/repetir`
Repete o áudio/atualização de painel da chamada atual (RN012). Não altera o estado da senha.

### `PUT /api/senhas/:id/finalizar`
Finaliza o atendimento: senha → `FINALIZADA`, esteira → `LIVRE` (RN009).

### `PUT /api/senhas/:id/cancelar`
Cancela uma senha ainda `AGUARDANDO` (RN013).

## Esteiras

### `GET /api/esteiras`
Lista todas as esteiras e seus estados (`LIVRE` / `OCUPADA`).

### `GET /api/esteiras/:id`
Retorna uma esteira específica.

## Painel

### `GET /api/painel`
Retorna o estado consolidado para o Painel Público: esteiras com a senha atual,
últimas chamadas, mensagem institucional e nome da empresa.

```json
{
  "sucesso": true,
  "dados": {
    "esteiras": [
      { "id": 1, "nome": "Esteira 1", "status": "OCUPADA", "senha_atual": { "numero": "A012", "...": "..." } },
      { "id": 2, "nome": "Esteira 2", "status": "LIVRE", "senha_atual": null }
    ],
    "ultimasChamadas": [ { "numero": "A011", "esteira_nome": "Esteira 2", "hora_chamada": "..." } ],
    "mensagemPainel": "Bem-vindo! Aguarde a chamada da sua senha.",
    "empresa": "Empresa de Abastecimento de Água",
    "dataReferencia": "2026-07-08"
  }
}
```

## Configurações

### `GET /api/configuracoes`
Retorna a configuração atual do sistema (empresa, áudio, volume, impressora, mensagem do painel).

### `PUT /api/configuracoes`
Atualiza uma ou mais configurações.

**Body (todos os campos opcionais):**
```json
{
  "empresa": "Águas do Vale Ltda.",
  "audio": true,
  "volume": 90,
  "mensagem_painel": "Boa tarde! Fique atento ao seu número."
}
```

---

## Eventos em tempo real (Socket.IO)

Conecte-se em `ws://<servidor>:<porta>` (o cliente Socket.IO é servido
automaticamente em `/socket.io/socket.io.js`).

| Evento | Quando ocorre | Payload principal |
|--------|----------------|--------------------|
| `senha:criada` | Nova senha emitida no Terminal | `{ senha }` |
| `senha:chamada` | Senha chamada para uma esteira (inclui dados de áudio) | `{ senha, esteira, modo, texto, volume }` |
| `senha:repetida` | Operador repetiu a chamada | `{ senha, esteira }` |
| `senha:cancelada` | Senha cancelada antes do atendimento | `{ senha }` |
| `atendimento:finalizado` | Atendimento concluído | `{ senha, esteira }` |
| `esteira:liberada` | Esteira voltou ao estado LIVRE | `{ esteira }` |
| `painel:atualizacao` | Qualquer mudança relevante para o painel/operador | `{ motivo }` |

O Painel Público e o Painel do Operador escutam esses eventos para atualizar
a tela automaticamente, sem necessidade de recarregar a página (RN011).

---

## Códigos de erro

| Código HTTP | `codigo` | Significado |
|-------------|----------|--------------|
| 404 | `NOT_FOUND` | Recurso (senha/esteira) não encontrado |
| 409 | `CONFLICT` | Violação de regra de estado (ex.: esteira ocupada, senha já chamada) |
| 422 | `VALIDATION_ERROR` | Dados de entrada inválidos |
| 500 | `INTERNAL_ERROR` | Erro inesperado no servidor |
