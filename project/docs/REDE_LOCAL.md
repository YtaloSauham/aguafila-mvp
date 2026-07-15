# Configuração em Rede Local

## Resumo

O sistema foi refatorado para funcionar como **cliente-servidor em rede local**:

- **1 Máquina Servidor:** Node.js + MariaDB (192.168.1.100 no exemplo)
- **N Máquinas Clientes:** Apenas navegador, consumindo API do servidor

## Variaveis de Ambiente (Backend)

### `HOST` (novo)
- **Padrão:** `0.0.0.0` (escuta em todas as interfaces)
- **Alternativa:** `localhost` (apenas local, para testes)
- **Efeito:** Determina em qual interface a aplicação escuta conexões

### `PORT`
- **Padrão:** `3000`
- **Efeito:** Porta do backend

### `CORS_ORIGIN`
- **Padrão:** `*` (libera todas as origens — recomendado em rede local fechada)
- **Alternativa:** `http://192.168.1.100:3000` (origem específica)
- **Alternativa múltipla:** `http://192.168.1.100:3000,http://10.0.0.5:3000` (lista separada por vírgula)
- **Efeito:** Controla quais máquinas clientes podem fazer requisições HTTP

### `DB_*`
- **Não mudou:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` continuam configuráveis
- **Nota:** Todos no servidor (não há replicação de BD local em clientes)

## Configuração do Frontend

### Padrão (via `/api`)
O cliente presume que a API está disponível em `/api` (mesmo host).
Funciona perfeitamente quando o frontend e backend estão no mesmo servidor.

### Customizado (via `config.json`)
Se quiser apontar a API para outro host, crie `frontend/assets/config.json`:

```json
{
  "apiBaseUrl": "http://192.168.1.100:3000/api",
  "socketUrl": "http://192.168.1.100:3000"
}
```

> **Nota:** Se não existir `config.json`, os valores padrão (`/api`, Socket.IO no mesmo host) são usados.

## Fluxo de Requisições

### Terminal (Máquina Cliente)
```
Cliente abre: http://192.168.1.100:3000/terminal
             ↓
Frontend carrega config.json (ou usa padrão)
             ↓
POST /api/senhas → http://192.168.1.100:3000/api/senhas
```

### Operador (Máquina Cliente)
```
Cliente abre: http://192.168.1.100:3000/operador
             ↓
GET /api/senhas → Fila
GET /api/painel → Estado
Socket.io connect → Escuta eventos
```

### Painel Público (TV na sala)
```
Cliente abre: http://192.168.1.100:3000/painel
             ↓
GET /api/painel → Esteiras
Socket.io connect → Escuta chamadas em tempo real
```

## Fluxo de Servidor

1. Backend inicia em `HOST=0.0.0.0` (todas as interfaces) + `PORT=3000`
2. CORS permite requisições conforme `CORS_ORIGIN`
3. Socket.IO usa a mesma configuração CORS
4. Frontend é servido estaticamente em `/terminal`, `/operador`, `/painel`

## Exemplo de Deployment

### Cenário: Empresa com pátio e escritório

**Máquina Servidor (192.168.1.100 — Escritório)**
```env
HOST=0.0.0.0
PORT=3000
DB_HOST=127.0.0.1
CORS_ORIGIN=*
PRINTER_DRIVER=console
AUDIO_MODE=tts
```

**Terminal de Emissão (192.168.1.101 — Pátio)**
- Abre: `http://192.168.1.100:3000/terminal`
- Requisita: `POST http://192.168.1.100:3000/api/senhas`

**Painel Operador (192.168.1.102 — Escritório)**
- Abre: `http://192.168.1.100:3000/operador`
- WebSocket: `ws://192.168.1.100:3000` (Socket.IO)

**Painel Público (TV — Pátio)**
- Abre: `http://192.168.1.100:3000/painel`
- WebSocket: `ws://192.168.1.100:3000` (Socket.IO)

---

## Checklist de Migração

- [ ] Backend: editar `.env` com `HOST=0.0.0.0` (ou IP específico)
- [ ] Backend: confirmar `CORS_ORIGIN=*` (ou lista de IPs)
- [ ] Backend: verificar `DB_HOST=127.0.0.1` (servidor local)
- [ ] Servidor: iniciar `npm start` e anotar IP exibido no log
- [ ] Clientes: abrir `http://<IP_SERVIDOR>:3000/terminal` (exemplo)
- [ ] Testar: verificar logs CORS no console do servidor
- [ ] Testar: certificar que Socket.IO conecta (Operador e Painel mostram "Conectado")
- [ ] Opcional: criar `frontend/assets/config.json` se precisar customizar URLs

---

## Troubleshooting

**Erro: `Origem não permitida pelo CORS`**
- Solução: Aumentar `CORS_ORIGIN` ou adicionar IP do cliente à lista

**Erro: `Connection refused` ao tentar GET /api**
- Solução: Verificar se servidor está rodando (`netstat -an | grep 3000`)
- Solução: Testar `curl http://192.168.1.100:3000/api` do cliente

**Socket.IO: Clientes conectam mas desconectam logo**
- Solução: Firewall pode estar bloqueando WebSocket; permitir porta 3000

**Frontend não consegue carregar `/assets/config.json`**
- Solução: Arquivo é opcional; sistema usa padrão (`/api`) se não encontrar

---

Para mais detalhes, veja [`INSTALACAO.md`](INSTALACAO.md).
