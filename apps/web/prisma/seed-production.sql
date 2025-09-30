-- ============================================
-- SCRIPT PARA CRIAR "TRELLO GERAL NEXMA" EM PRODUÇÃO
-- ============================================
-- Este script cria o board compartilhado da organização
-- com colunas e card de boas-vindas
-- ============================================

-- IMPORTANTE: Substitua 'SEU_USER_ID_AQUI' pelo ID real do usuário admin
-- Para descobrir o ID, execute: SELECT id, email FROM "User" LIMIT 5;

-- 1. Criar o Board "Trello Geral Nexma" (compartilhado com toda organização)
INSERT INTO "Board" (id, title, "isOrgWide", "ownerId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(), -- Gera ID único
  'Trello Geral Nexma',
  true, -- isOrgWide = true (todos veem)
  'SEU_USER_ID_AQUI', -- SUBSTITUA pelo ID do admin
  NOW(),
  NOW()
)
RETURNING id; -- Anote este ID para usar nos próximos comandos

-- ============================================
-- DEPOIS DE EXECUTAR O COMANDO ACIMA, COPIE O ID RETORNADO
-- E SUBSTITUA 'BOARD_ID_AQUI' NOS COMANDOS ABAIXO
-- ============================================

-- 2. Criar Colunas do Board
INSERT INTO "Column" (id, "boardId", title, "order", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'BOARD_ID_AQUI', '📢 Anúncios Gerais', 0, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '🎨 Design', 1, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '💻 Desenvolvimento', 2, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '📱 Marketing', 3, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '🎯 Metas', 4, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '📋 Processos', 5, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '✅ Finalizado', 6, NOW(), NOW())
RETURNING id, title; -- Anote o ID da coluna "Anúncios Gerais" para o próximo passo

-- ============================================
-- COPIE O ID DA COLUNA "📢 Anúncios Gerais"
-- E SUBSTITUA 'COLUMN_ID_AQUI' NO COMANDO ABAIXO
-- ============================================

-- 3. Criar Card de Boas-Vindas
INSERT INTO "Card" (
  id,
  "boardId",
  "columnId",
  title,
  description,
  urgency,
  "createdById",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'BOARD_ID_AQUI',
  'COLUMN_ID_AQUI',
  '🎉 Bem-vindo ao Trello Geral da Nexma!',
  E'Este é o espaço compartilhado de toda a empresa. 📋 Como usar:\n\n- Use as colunas para organizar anúncios e tarefas gerais\n- Todos os membros da empresa podem ver este board\n- Crie cards para comunicar novidades\n- Utilize as checklists para acompanhar progresso\n- Atribua pessoas aos cards quando necessário\n\n💡 Dica: Boards privados podem ser criados pelo botão "+ Criar Board" no dashboard!',
  'MEDIUM',
  'SEU_USER_ID_AQUI',
  NOW(),
  NOW()
);

-- ============================================
-- VERIFICAÇÃO (Execute para confirmar)
-- ============================================

-- Ver o board criado
SELECT id, title, "isOrgWide", "ownerId" FROM "Board" WHERE title = 'Trello Geral Nexma';

-- Ver as colunas criadas
SELECT c.id, c.title, c."order"
FROM "Column" c
JOIN "Board" b ON c."boardId" = b.id
WHERE b.title = 'Trello Geral Nexma'
ORDER BY c."order";

-- Ver os cards criados
SELECT ca.id, ca.title, co.title as coluna
FROM "Card" ca
JOIN "Column" co ON ca."columnId" = co.id
JOIN "Board" b ON ca."boardId" = b.id
WHERE b.title = 'Trello Geral Nexma';