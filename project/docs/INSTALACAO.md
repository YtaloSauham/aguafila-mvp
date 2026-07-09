# Instalação e Execução (Rede Local)

Guia passo a passo para colocar o sistema em funcionamento em uma rede local (LAN),
sem dependência de internet.

## 1. Pré-requisitos

- **Node.js** 18 ou superior (`node -v`)
- **MariaDB** 10.x instalado e em execução na máquina servidor
- Rede local (Wi-Fi ou cabo) conectando o servidor aos terminais/painéis

> Todos os computadores (terminal, operador, painel) devem conseguir acessar
> o IP da máquina onde o backend está rodando, na mesma rede.

## 2. Banco de dados

Crie um usuário dedicado no MariaDB (recomendado) ou utilize o `root` em ambiente de testes:

```sql
CREATE USER 'aguafila_user'@'%' IDENTIFIED BY 'troque_esta_senha';
GRANT ALL PRIVILEGES ON aguafila_db.* TO 'aguafila_user'@'%';
FLUSH PRIVILEGES;
```

Execute os scripts SQL (criam o banco, tabelas e dados iniciais):

```bash
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/seed.sql
```

Alternativamente, com o backend já configurado (passo 3), é possível rodar via Node:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

## 3. Backend

```bash
cd backend
cp .env.example .env
```

Edite o `.env` com as credenciais do seu MariaDB:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=aguafila_user
DB_PASSWORD=troque_esta_senha
DB_NAME=aguafila_db
PORT=3000
```

Instale as dependências e inicie o servidor:

```bash
npm install
npm start
```

Se tudo estiver correto, o console mostrará:

```
[INFO] Conectado ao MariaDB em 127.0.0.1:3306/aguafila_db
[INFO] Socket.IO inicializado.
[INFO] Servidor rodando em http://localhost:3000
```

## 4. Acessando as interfaces

O backend também serve os arquivos estáticos do frontend — não é necessário
nenhum servidor web adicional.

| Interface | URL local | URL na rede (substitua pelo IP do servidor) |
|-----------|-----------|----------------------------------------------|
| Terminal de Autoatendimento | `http://localhost:3000/terminal` | `http://192.168.0.10:3000/terminal` |
| Painel do Operador | `http://localhost:3000/operador` | `http://192.168.0.10:3000/operador` |
| Painel Público (TV/monitor) | `http://localhost:3000/painel` | `http://192.168.0.10:3000/painel` |

Para descobrir o IP do servidor na rede local:

```bash
# Linux/macOS
ip addr show   # ou: ifconfig

# Windows
ipconfig
```

Configure cada computador/dispositivo (terminal, operador, TV) para abrir a
URL correspondente em modo tela cheia (kiosk) no navegador.

## 5. Impressora térmica

Por padrão, o sistema usa o driver `console` (`PRINTER_DRIVER=console` no `.env`),
que apenas registra o comprovante no log do servidor — útil para desenvolvimento
e testes sem hardware.

Para conectar uma impressora térmica real, implemente um driver seguindo o
contrato de `backend/services/printer/PrinterDriver.js` (veja também o
esqueleto em `EscPosPrinterDriver.js`) e ajuste `PRINTER_DRIVER` no `.env`.
Nenhuma outra parte do sistema precisa ser alterada.

## 6. Áudio das chamadas

Por padrão, `AUDIO_MODE=tts`: o Painel Público sintetiza a voz localmente no
navegador (Web Speech API), sem necessidade de arquivos de áudio nem internet.

> **Importante:** navegadores exigem uma interação do usuário (clique/toque)
> antes de permitir áudio automático. A tela do Painel Público exibe uma
> primeira interação implícita (qualquer toque na tela) que desbloqueia o som
> — toque na tela uma vez após abrir o painel.

Para usar áudios pré-gravados no lugar do TTS, veja `frontend/assets/audio/README.md`
e ajuste `AUDIO_MODE=arquivo` no `.env`.

## 7. Rodando como serviço (opcional)

Para manter o backend sempre em execução no servidor local, considere usar
um gerenciador de processos como o `pm2`:

```bash
npm install -g pm2
pm2 start server.js --name aguafila
pm2 save
pm2 startup
```

## 8. Solução de problemas

| Sintoma | Possível causa |
|---------|-----------------|
| `Falha ao conectar ao MariaDB` no console | Credenciais erradas no `.env` ou serviço MariaDB parado |
| Painel/Operador não atualizam em tempo real | Firewall bloqueando a porta configurada (`PORT`) na rede local |
| Terminal não imprime | Driver `PRINTER_DRIVER` não implementado para o hardware — verifique o log do servidor |
| Áudio não toca no painel | Nenhum toque inicial na tela (bloqueio de autoplay do navegador) |
