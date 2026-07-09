-- =============================================================================
-- Sistema de Gerenciamento de Atendimento - Abastecimento de Água (MVP)
-- Script de criação do banco de dados (MariaDB)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS aguafila_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aguafila_db;

-- -----------------------------------------------------------------------------
-- Tabela: esteiras
-- Representa as esteiras físicas de carregamento (RN005, RN007).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS esteiras (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome                VARCHAR(50)   NOT NULL,
  status              ENUM('LIVRE', 'OCUPADA') NOT NULL DEFAULT 'LIVRE',
  senha_atual_id      INT UNSIGNED  NULL,
  ultima_atualizacao  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
  criado_em           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_esteiras_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabela: senhas
-- Fila única de senhas (RN001, RN002, RN003, RN004).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS senhas (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero              VARCHAR(10)   NOT NULL,          -- Ex: A001, A002...
  sequencial          INT UNSIGNED  NOT NULL,          -- Número sequencial do dia
  data                DATE          NOT NULL,          -- Data de emissão (para reinício diário - RN003)
  hora_emissao        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  hora_chamada        DATETIME      NULL,
  hora_inicio         DATETIME      NULL,
  hora_finalizacao    DATETIME      NULL,
  status              ENUM('AGUARDANDO', 'CHAMADA', 'EM_ATENDIMENTO', 'FINALIZADA', 'CANCELADA')
                                     NOT NULL DEFAULT 'AGUARDANDO',
  esteira_id          INT UNSIGNED  NULL,

  CONSTRAINT fk_senhas_esteira
    FOREIGN KEY (esteira_id) REFERENCES esteiras(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  -- RN004: não pode haver duas senhas iguais no mesmo dia
  UNIQUE KEY uq_senhas_numero_data (numero, data),
  UNIQUE KEY uq_senhas_sequencial_data (sequencial, data),

  KEY idx_senhas_status (status),
  KEY idx_senhas_data (data),
  KEY idx_senhas_data_status (data, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chave estrangeira reversa: esteira aponta para a senha que está atendendo
ALTER TABLE esteiras
  ADD CONSTRAINT fk_esteiras_senha_atual
    FOREIGN KEY (senha_atual_id) REFERENCES senhas(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- Tabela: configuracoes
-- Configurações gerais do sistema (chave única - registro singleton).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracoes (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa             VARCHAR(150)  NOT NULL DEFAULT 'Empresa de Abastecimento de Água',
  audio               TINYINT(1)    NOT NULL DEFAULT 1,
  volume              TINYINT UNSIGNED NOT NULL DEFAULT 100,
  impressora          VARCHAR(100)  NOT NULL DEFAULT 'console',
  porta               VARCHAR(50)   NULL,
  reinicio_diario     TINYINT(1)    NOT NULL DEFAULT 1,
  mensagem_painel     VARCHAR(255)  NOT NULL DEFAULT 'Bem-vindo! Aguarde a chamada da sua senha.',
  atualizado_em       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice auxiliar para consultas do painel (últimas chamadas)
CREATE INDEX idx_senhas_hora_chamada ON senhas (hora_chamada);
