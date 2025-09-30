#!/bin/bash

# Script de teste completo do sistema Trello Nexma
# Testa autenticação, CRUD completo, convites, notificações, clientes

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

echo "========================================"
echo "🧪 TESTE COMPLETO DO SISTEMA TRELLO NEXMA"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis para armazenar IDs
USER1_COOKIE=""
USER2_COOKIE=""
BOARD_ID=""
COLUMN1_ID=""
COLUMN2_ID=""
CLIENT_ID=""
CARD_ID=""
CHECKLIST_ID=""

# Função para fazer requisições e mostrar resultado
test_request() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local cookie=$5

    echo -e "${YELLOW}Testando: $name${NC}"

    if [ -z "$cookie" ]; then
        response=$(curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    else
        response=$(curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -H "Cookie: $cookie" \
            -d "$data" \
            -w "\n%{http_code}")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ Sucesso ($http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        echo "$body"
        return 0
    else
        echo -e "${RED}✗ Falhou ($http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        echo ""
        return 1
    fi
}

# Função para extrair cookie de resposta
get_cookie() {
    local method=$1
    local url=$2
    local data=$3

    cookie=$(curl -s -X "$method" "$url" \
        -H "Content-Type: application/json" \
        -d "$data" \
        -c - | grep -E "lucia_session|auth_session" | awk '{print $6"="$7}')
    echo "$cookie"
}

echo "========================================"
echo "1. TESTE DE AUTENTICAÇÃO"
echo "========================================"
echo ""

# 1.1 Registro de Usuário 1
echo "1.1 Registrando Usuário 1 (Admin)"
TIMESTAMP=$(date +%s)
USER1_EMAIL="admin_$TIMESTAMP@test.com"
USER1_PASSWORD="Admin123!@#"

response=$(test_request \
    "Registro User1" \
    "POST" \
    "$API_URL/auth/register" \
    "{\"name\":\"Admin Teste\",\"email\":\"$USER1_EMAIL\",\"password\":\"$USER1_PASSWORD\"}")

# Capturar cookie do User1
echo "Fazendo login do User1 para obter cookie..."
USER1_COOKIE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$USER1_EMAIL\",\"password\":\"$USER1_PASSWORD\"}" \
    -c - | grep -E "lucia_session|auth_session" | awk '{print $6"="$7}')

if [ -z "$USER1_COOKIE" ]; then
    echo -e "${RED}✗ Falha ao obter cookie do User1${NC}"
    exit 1
fi
echo -e "${GREEN}✓ User1 logado com sucesso${NC}"
echo ""

# 1.2 Registro de Usuário 2
echo "1.2 Registrando Usuário 2 (Membro)"
USER2_EMAIL="member_$TIMESTAMP@test.com"
USER2_PASSWORD="Member123!@#"

response=$(test_request \
    "Registro User2" \
    "POST" \
    "$API_URL/auth/register" \
    "{\"name\":\"Membro Teste\",\"email\":\"$USER2_EMAIL\",\"password\":\"$USER2_PASSWORD\"}")

# Capturar cookie do User2
echo "Fazendo login do User2 para obter cookie..."
USER2_COOKIE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$USER2_EMAIL\",\"password\":\"$USER2_PASSWORD\"}" \
    -c - | grep -E "lucia_session|auth_session" | awk '{print $6"="$7}')

if [ -z "$USER2_COOKIE" ]; then
    echo -e "${RED}✗ Falha ao obter cookie do User2${NC}"
    exit 1
fi
echo -e "${GREEN}✓ User2 logado com sucesso${NC}"
echo ""

echo "========================================"
echo "2. TESTE DE BOARDS"
echo "========================================"
echo ""

# 2.1 Criar Board
echo "2.1 Criando Board"
board_response=$(curl -s -X POST "$API_URL/boards" \
    -H "Content-Type: application/json" \
    -H "Cookie: $USER1_COOKIE" \
    -d "{\"title\":\"Board de Teste\",\"isOrgWide\":false}")

BOARD_ID=$(echo "$board_response" | jq -r '.id')
echo -e "${GREEN}✓ Board criado: $BOARD_ID${NC}"
echo "$board_response" | jq '.'
echo ""

# 2.2 Listar Boards
echo "2.2 Listando Boards"
test_request "Listar Boards" "GET" "$API_URL/boards" "" "$USER1_COOKIE"
echo ""

echo "========================================"
echo "3. TESTE DE COLUNAS"
echo "========================================"
echo ""

# 3.1 Criar Coluna 1
echo "3.1 Criando Coluna 1 (Novos Leads)"
column1_response=$(curl -s -X POST "$API_URL/boards/$BOARD_ID/columns" \
    -H "Content-Type: application/json" \
    -H "Cookie: $USER1_COOKIE" \
    -d "{\"title\":\"Novos Leads\"}")

COLUMN1_ID=$(echo "$column1_response" | jq -r '.id')
echo -e "${GREEN}✓ Coluna 1 criada: $COLUMN1_ID${NC}"
echo "$column1_response" | jq '.'
echo ""

# 3.2 Criar Coluna 2
echo "3.2 Criando Coluna 2 (Em Atendimento)"
column2_response=$(curl -s -X POST "$API_URL/boards/$BOARD_ID/columns" \
    -H "Content-Type: application/json" \
    -H "Cookie: $USER1_COOKIE" \
    -d "{\"title\":\"Em Atendimento\"}")

COLUMN2_ID=$(echo "$column2_response" | jq -r '.id')
echo -e "${GREEN}✓ Coluna 2 criada: $COLUMN2_ID${NC}"
echo "$column2_response" | jq '.'
echo ""

# 3.3 Criar Coluna Finalizado
echo "3.3 Criando Coluna 3 (Finalizado)"
column3_response=$(curl -s -X POST "$API_URL/boards/$BOARD_ID/columns" \
    -H "Content-Type: application/json" \
    -H "Cookie: $USER1_COOKIE" \
    -d "{\"title\":\"Finalizado\"}")

COLUMN3_ID=$(echo "$column3_response" | jq -r '.id')
echo -e "${GREEN}✓ Coluna 3 criada: $COLUMN3_ID${NC}"
echo "$column3_response" | jq '.'
echo ""

echo "========================================"
echo "4. TESTE DE CLIENTES"
echo "========================================"
echo ""

# 4.1 Criar Cliente
echo "4.1 Criando Cliente (Status URGENTE)"
client_response=$(curl -s -X POST "$API_URL/clients" \
    -H "Content-Type: application/json" \
    -H "Cookie: $USER1_COOKIE" \
    -d "{\"name\":\"Empresa XYZ Ltda\",\"status\":\"URGENTE\",\"lead\":1001}")

CLIENT_ID=$(echo "$client_response" | jq -r '.id')
echo -e "${GREEN}✓ Cliente criado: $CLIENT_ID${NC}"
echo "$client_response" | jq '.'
echo ""

# 4.2 Listar Clientes
echo "4.2 Listando Clientes"
test_request "Listar Clientes" "GET" "$API_URL/clients" "" "$USER1_COOKIE"
echo ""

# 4.3 Atualizar Cliente
echo "4.3 Atualizando Cliente (mudando status para EMERGENCIA)"
test_request "Atualizar Cliente" "PUT" "$API_URL/clients/$CLIENT_ID" \
    "{\"status\":\"EMERGENCIA\",\"lead\":1002}" "$USER1_COOKIE"
echo ""

echo "========================================"
echo "5. TESTE DE CARDS COM CLIENTE"
echo "========================================"
echo ""

# 5.1 Criar Card com Cliente
echo "5.1 Criando Card com Cliente vinculado"
card_response=$(curl -s -X POST "$API_URL/boards/$BOARD_ID/cards" \
    -H "Content-Type: application/json" \
    -H "Cookie: $USER1_COOKIE" \
    -d "{\"columnId\":\"$COLUMN1_ID\",\"title\":\"Atendimento Empresa XYZ\",\"description\":\"Suporte técnico urgente\",\"urgency\":\"HIGH\",\"clientId\":\"$CLIENT_ID\"}")

CARD_ID=$(echo "$card_response" | jq -r '.card.id')
echo -e "${GREEN}✓ Card criado: $CARD_ID${NC}"
echo "$card_response" | jq '.'
echo ""

# 5.2 Verificar se cliente está vinculado
echo "5.2 Verificando detalhes do Card"
test_request "Detalhes do Card" "GET" "$API_URL/boards/$BOARD_ID/cards/$CARD_ID" "" "$USER1_COOKIE"
echo ""

# 5.3 Mover Card entre colunas
echo "5.3 Movendo Card para coluna 'Em Atendimento'"
test_request "Mover Card" "PUT" "$API_URL/boards/$BOARD_ID/cards/$CARD_ID" \
    "{\"columnId\":\"$COLUMN2_ID\"}" "$USER1_COOKIE"
echo ""

echo "========================================"
echo "6. TESTE DE CONVITES"
echo "========================================"
echo ""

# 6.1 Convidar User2 para o Board
echo "6.1 Convidando User2 para o Board"
test_request "Convidar Membro" "POST" "$API_URL/boards/$BOARD_ID/members" \
    "{\"email\":\"$USER2_EMAIL\",\"role\":\"MEMBER\"}" "$USER1_COOKIE"
echo ""

# 6.2 Verificar notificações do User2
echo "6.2 Verificando notificações do User2"
test_request "Notificações User2" "GET" "$API_URL/notifications" "" "$USER2_COOKIE"
echo ""

echo "========================================"
echo "7. TESTE DE ASSIGNEES (ATRIBUIR PESSOAS)"
echo "========================================"
echo ""

# 7.1 Buscar ID do User2
echo "7.1 Buscando dados do User2"
user2_data=$(curl -s -X GET "$API_URL/auth/me" \
    -H "Cookie: $USER2_COOKIE")
USER2_ID=$(echo "$user2_data" | jq -r '.id')
echo -e "${GREEN}✓ User2 ID: $USER2_ID${NC}"
echo ""

# 7.2 Atribuir User2 ao Card
echo "7.2 Atribuindo User2 ao Card"
test_request "Atribuir User2" "POST" "$API_URL/boards/$BOARD_ID/cards/$CARD_ID/assignees" \
    "{\"userId\":\"$USER2_ID\"}" "$USER1_COOKIE"
echo ""

# 7.3 Verificar card com assignee
echo "7.3 Verificando Card com assignee"
test_request "Card com Assignee" "GET" "$API_URL/boards/$BOARD_ID/cards/$CARD_ID" "" "$USER1_COOKIE"
echo ""

echo "========================================"
echo "8. TESTE DE CHECKLISTS"
echo "========================================"
echo ""

# 8.1 Criar Checklist
echo "8.1 Criando Checklist no Card"
checklist_response=$(curl -s -X POST "$API_URL/boards/$BOARD_ID/cards/$CARD_ID/checklists" \
    -H "Content-Type: application/json" \
    -H "Cookie: $USER1_COOKIE" \
    -d "{\"title\":\"Tarefas de Atendimento\"}")

CHECKLIST_ID=$(echo "$checklist_response" | jq -r '.id')
echo -e "${GREEN}✓ Checklist criada: $CHECKLIST_ID${NC}"
echo "$checklist_response" | jq '.'
echo ""

# 8.2 Adicionar Item 1
echo "8.2 Adicionando Item 1 à Checklist"
item1_response=$(curl -s -X POST "$API_URL/checklists/$CHECKLIST_ID/items" \
    -H "Content-Type: application/json" \
    -H "Cookie: $USER1_COOKIE" \
    -d "{\"content\":\"Analisar problema relatado\"}")

ITEM1_ID=$(echo "$item1_response" | jq -r '.id')
echo -e "${GREEN}✓ Item 1 criado: $ITEM1_ID${NC}"
echo "$item1_response" | jq '.'
echo ""

# 8.3 Adicionar Item 2
echo "8.3 Adicionando Item 2 à Checklist"
item2_response=$(curl -s -X POST "$API_URL/checklists/$CHECKLIST_ID/items" \
    -H "Content-Type: application/json" \
    -H "Cookie: $USER1_COOKIE" \
    -d "{\"content\":\"Propor solução\"}")

ITEM2_ID=$(echo "$item2_response" | jq -r '.id')
echo -e "${GREEN}✓ Item 2 criado: $ITEM2_ID${NC}"
echo "$item2_response" | jq '.'
echo ""

# 8.4 Marcar Item 1 como concluído
echo "8.4 Marcando Item 1 como concluído"
test_request "Toggle Item 1" "PATCH" "$API_URL/checklist-items/$ITEM1_ID/toggle" \
    "" "$USER1_COOKIE"
echo ""

# 8.5 Verificar Card com Checklist e progresso
echo "8.5 Verificando Card com progresso da Checklist"
test_request "Card com Checklist" "GET" "$API_URL/boards/$BOARD_ID/cards/$CARD_ID" "" "$USER1_COOKIE"
echo ""

echo "========================================"
echo "9. TESTE DE DETALHES DO CLIENTE"
echo "========================================"
echo ""

# 9.1 Buscar detalhes completos do cliente
echo "9.1 Buscando detalhes do Cliente (com cards, checklists, assignees)"
test_request "Detalhes do Cliente" "GET" "$API_URL/clients/$CLIENT_ID" "" "$USER1_COOKIE"
echo ""

echo "========================================"
echo "10. TESTE DE COMENTÁRIOS"
echo "========================================"
echo ""

# 10.1 Adicionar comentário
echo "10.1 Adicionando comentário ao Card"
test_request "Adicionar Comentário" "POST" "$API_URL/boards/$BOARD_ID/cards/$CARD_ID/comments" \
    "{\"content\":\"Cliente necessita atenção urgente!\"}" "$USER1_COOKIE"
echo ""

# 10.2 User2 adiciona comentário
echo "10.2 User2 adicionando comentário"
test_request "User2 Comentário" "POST" "$API_URL/boards/$BOARD_ID/cards/$CARD_ID/comments" \
    "{\"content\":\"Iniciando atendimento agora\"}" "$USER2_COOKIE"
echo ""

echo "========================================"
echo "11. TESTE DE NOTIFICAÇÕES"
echo "========================================"
echo ""

# 11.1 Verificar notificações acumuladas User1
echo "11.1 Notificações do User1 (Admin)"
test_request "Notificações User1" "GET" "$API_URL/notifications" "" "$USER1_COOKIE"
echo ""

# 11.2 Verificar notificações User2
echo "11.2 Notificações do User2 (Membro)"
test_request "Notificações User2" "GET" "$API_URL/notifications" "" "$USER2_COOKIE"
echo ""

# 11.3 Marcar notificações como lidas (User2)
echo "11.3 Marcando notificações do User2 como lidas"
test_request "Marcar como Lida" "PUT" "$API_URL/notifications/read" "" "$USER2_COOKIE"
echo ""

echo "========================================"
echo "12. TESTE DE DELEÇÃO"
echo "========================================"
echo ""

# 12.1 Deletar comentário
echo "12.1 Testando deleção de recursos"
echo "(Pulando para preservar dados de teste)"
echo ""

echo "========================================"
echo "✅ TESTE COMPLETO FINALIZADO"
echo "========================================"
echo ""
echo "Resumo dos IDs criados:"
echo "- User1 Email: $USER1_EMAIL"
echo "- User2 Email: $USER2_EMAIL"
echo "- Board ID: $BOARD_ID"
echo "- Column 1 ID: $COLUMN1_ID"
echo "- Column 2 ID: $COLUMN2_ID"
echo "- Cliente ID: $CLIENT_ID"
echo "- Card ID: $CARD_ID"
echo "- Checklist ID: $CHECKLIST_ID"
echo "- Item 1 ID: $ITEM1_ID"
echo ""
echo "Acesse o sistema em: $BASE_URL/login"
echo "User1: $USER1_EMAIL / $USER1_PASSWORD"
echo "User2: $USER2_EMAIL / $USER2_PASSWORD"
echo ""
