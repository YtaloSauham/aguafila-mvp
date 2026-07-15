# Instalação e Execução (Arquitetura Cliente-Servidor em Rede Local)

Guia passo a passo para colocar o sistema em funcionamento em uma rede local (LAN),
com uma única máquina servidor rodando Node.js e MariaDB, e demais máquinas como clientes
consumidoras da API REST e eventos Socket.IO.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│ Máquina Servidor (192.168.1.100)                            │
├─────────────────────────────────────────────────────────────┤
│  • Node.js (Backend) – Escuta em 0.0.0.0:3000               │
│  • MariaDB – Banco de dados central                         │
│  • Express + Socket.IO – API REST e eventos em tempo real   │
└─────────────────────────────────────────────────────────────┘
       ▲                   ▲                    ▲
       │ HTTP / WebSocket  │ HTTP / WebSocket   │ HTTP / WebSocket
       │                   │                    │
   ┌───────┐           ┌───────┐           ┌───────┐
   │ Termo │           │ Oper. │           │Painel │
   │(Cli1) │           │(Cli2) │           │ (TV)  │
   └───────┘           └───────┘           └───────┘
     Máquina B           Máquina C         Qualquer
     (sem BD local)      (sem BD local)    dispositivo
                                            com navegador
```

## 1. Pré-requisitos

### Máquina Servidor
- **Node.js** 18 ou superior (`node -v`)
- **MariaDB** 10.x instalado e em execução
- IP fixo na rede local (ex: `192.168.1.100`)

### Máquinas Clientes (Terminal, Operador, Painel)
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Sem necessidade de Node.js ou MariaDB
- Conectadas à mesma rede local que o servidor

> **Importante:** Configure o servidor com um IP fixo para que os clientes sempre encontrem-no.

## 2. Banco de dados (Máquina Servidor)

Crie um usuário dedicado no MariaDB (recomendado):

```sql
CREATE USER 'aguafila_user'@'%' IDENTIFIED BY 'senha_segura_123';
GRANT ALL PRIVILEGES ON aguafila_db.* TO 'aguafila_user'@'%';
FLUSH PRIVILEGES;
```

Execute os scripts SQL:

```bash
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/seed.sql
```

Ou, após configurar o backend (próxima seção):

```bash
cd backend
npm run db:migrate
npm run db:seed
```

## 3. Backend (Máquina Servidor)

```bash
cd backend
cp .env.example .env
```

Edite o `.env` conforme seu ambiente:

```env
# Servidor escuta em todas as interfaces (0.0.0.0)
HOST=0.0.0.0
PORT=3000
NODE_ENV=production

# Banco de dados - máquina local
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=aguafila_user
DB_PASSWORD=senha_segura_123
DB_NAME=aguafila_db

# CORS - libera clientes da rede local
CORS_ORIGIN=*

# Demais configurações
PRINTER_DRIVER=console
AUDIO_MODE=tts
TOTAL_ESTEIRAS=2
REINICIO_DIARIO=true
LOG_LEVEL=info
```

Instale as dependências e inicie o servidor:

```bash
npm install
npm start
```

Se tudo estiver correto, o console exibirá algo como:

```
[INFO] Conectado ao MariaDB em 127.0.0.1:3306/aguafila_db
[INFO] Socket.IO inicializado.
[INFO] Servidor rodando em http://192.168.1.100:3000
[INFO] Terminal:  http://192.168.1.100:3000/terminal
[INFO] Operador:  http://192.168.1.100:3000/operador
[INFO] Painel:    http://192.168.1.100:3000/painel
[INFO] Acesse localmente: http://localhost:3000
[INFO] Acesse na rede local: http://192.168.1.100:3000
```

## 4. Acessando as interfaces (Máquinas Clientes)

O backend serve automaticamente o frontend — não é necessário nenhum servidor web adicional.

| Interface | URL Local | URL Rede Local |
|-----------|-----------|---------|
| Terminal de Autoatendimento | `http://localhost:3000/terminal` | `http://192.168.1.100:3000/terminal` |
| Painel do Operador | `http://localhost:3000/operador` | `http://192.168.1.100:3000/operador` |
| Painel Público (TV/monitor) | `http://localhost:3000/painel` | `http://192.168.1.100:3000/painel` |

### Descobrindo o IP do servidor

```bash
# Linux / macOS
hostname -I
# ou
ifconfig | grep "inet "

# Windows
ipconfig
```

Procure por um endereço `192.168.x.x` ou `10.0.x.x` que corresponda à interface de rede local.

### Configurando cada cliente

- **Terminal de emissão:** Configure o navegador (modo tela cheia/kiosk) para abrir `http://192.168.1.100:3000/terminal` ao iniciar.
- **Painel do operador:** Mesmo processo, URL `/operador`.
- **Painel público (TV):** URL `/painel` em modo tela cheia, preferencialmente em uma TV/monitor 24/7.

### Configuração avançada (opcional)

Se precisar customizar a URL da API ou Socket.IO em alguma máquina cliente, edite `frontend/assets/config.json`:

```json
{
  "apiBaseUrl": "http://192.168.1.100:3000/api",
  "socketUrl": "http://192.168.1.100:3000"
}
```

## 5. Impressora térmica

Por padrão, usa-se o driver `console` (apenas registra no log — desenvolvimento/testes).

Para conectar impressora real na **máquina servidor**, implemente um driver seguindo o
contrato em `backend/services/printer/PrinterDriver.js` e ajuste `PRINTER_DRIVER` no `.env`.

Nenhuma outra parte do sistema precisa ser alterada.

## 6. Áudio das chamadas

Padrão: `AUDIO_MODE=tts` — o **Painel Público** sintetiza voz localmente no navegador
(Web Speech API), sem arquivos de áudio nem internet.

> **Importante:** Navegadores exigem uma interação do usuário (clique/toque) antes de
> permitir áudio automático. **Toque na tela do Painel uma vez após abri-lo para desbloquear o som.**

Para usar áudios pré-gravados, veja `frontend/assets/audio/README.md` e ajuste `AUDIO_MODE=arquivo`.

## 7. Mantendo o servidor em execução (opcional)

Para que o backend rode 24/7, use um gerenciador de processos como `pm2`:

```bash
npm install -g pm2
cd backend
pm2 start server.js --name aguafila
pm2 save
pm2 startup  # (segue instruções para ativar ao boot)
```

## 8. Solução de problemas

| Sintoma | Possível causa | Solução |
|---------|-----------------|---------|
| `Falha ao conectar ao MariaDB` no console | Credenciais erradas ou MariaDB parado | Verifique `.env` e `mysql -u aguafila_user -p -e "SELECT 1"` |
| Clientes não conectam | Firewall bloqueando porta 3000 | Abra porta 3000 no firewall ou use `UFW allow 3000` |
| Socket.IO desconecta constantemente | Firewall bloqueando WebSocket | Configure firewall para permitir WebSocket na porta 3000 |
| Terminal não imprime | Driver `PRINTER_DRIVER` não implementado | Verifique log do servidor e ajuste `PRINTER_DRIVER` |
| Áudio não toca no painel | Navegador bloqueou autoplay | Toque qualquer lugar da tela do Painel para desbloquear |
| Clientes veem erro de CORS | `CORS_ORIGIN` muito restritivo | Ajuste `CORS_ORIGIN=*` ou inclua IP/porta do cliente |

---

**Próximos passos:** Use [`AguaFila-Documentacao-Tecnica.md`](../AguaFila-Documentacao-Tecnica.md) para entender a arquitetura em detalhes e as regras de negócio implementadas.
