-- =============================================================================
-- Dados iniciais (seed) - Sistema de Gerenciamento de Atendimento
-- Execute após schema.sql
-- =============================================================================

USE aguafila_db;

-- Duas esteiras, conforme especificação do MVP
INSERT INTO esteiras (nome, status)
SELECT 'Esteira 1', 'LIVRE'
WHERE NOT EXISTS (SELECT 1 FROM esteiras WHERE nome = 'Esteira 1');

INSERT INTO esteiras (nome, status)
SELECT 'Esteira 2', 'LIVRE'
WHERE NOT EXISTS (SELECT 1 FROM esteiras WHERE nome = 'Esteira 2');

-- Configuração padrão (registro único, id = 1)
INSERT INTO configuracoes (id, empresa, audio, volume, impressora, porta, reinicio_diario, mensagem_painel)
SELECT 1, 'Empresa de Abastecimento de Água', 1, 100, 'console', NULL, 1,
       'Bem-vindo! Aguarde a chamada da sua senha.'
WHERE NOT EXISTS (SELECT 1 FROM configuracoes WHERE id = 1);
