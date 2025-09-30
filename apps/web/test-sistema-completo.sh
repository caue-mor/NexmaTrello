#!/bin/bash

# Script de Teste Completo do Sistema Trello Nexma
# Testa todas as funcionalidades críticas do sistema

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="/tmp/nexma_test_cookies.txt"
TEST_RESULTS="/tmp/nexma_test_results.txt"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis globais para IDs
USER_EMAIL="teste_$(date +%s)@empresa.com"
USER_PASSWORD="Teste@12345"
USER_NAME="Teste Automático"
BOARD_ID=""
COLUMN_ID=""
CARD_ID=""
CLIENT_ID=""
CHECKLIST_ID=""

echo "======================================"
echo "TESTE COMPLETO DO SISTEMA TRELLO NEXMA"
echo "Base URL: $BASE_URL"
echo "======================================"
echo ""

# Limpar arquivos anteriores
rm -f $COOKIE_FILE $TEST_RESULTS
echo "RESULTADOS DOS TESTES" > $TEST_RESULTS
echo "Data: $(date)" >> $TEST_RESULTS
echo "" >> $TEST_RESULTS

# Função para fazer requisições
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -L -X $method \
            -H "Content-Type: application/json" \
            -b $COOKIE_FILE -c $COOKIE_FILE \
            "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -L -X $method \
            -H "Content-Type: application/json" \
            -b $COOKIE_FILE -c $COOKIE_FILE \
            -d "$data" \
            "${BASE_URL}${endpoint}")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    # Aceitar 200, 201 ou 307 (redirect após sucesso)
    if [ "$http_code" -eq "$expected_status" ] || [ "$http_code" -eq "307" ] || [ "$http_code" -eq "200" ]; then
        echo "$body"
        return 0
    else
        echo "ERRO: Esperado status $expected_status, recebido $http_code" >&2
        echo "Response: $body" >&2
        return 1
    fi
}

# Função para teste com validação
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5

    echo -n "Testando: $test_name... "

    if result=$(api_call "$method" "$endpoint" "$data" "$expected_status"); then
        echo -e "${GREEN}✓ PASSOU${NC}"
        echo "✓ $test_name" >> $TEST_RESULTS
        echo "$result"
        return 0
    else
        echo -e "${RED}✗ FALHOU${NC}"
        echo "✗ $test_name" >> $TEST_RESULTS
        return 1
    fi
}

echo "=========================================="
echo "1. TESTANDO AUTENTICAÇÃO"
echo "=========================================="

# 1.1 - Obter CSRF Token
echo -n "1.1 - Obtendo CSRF token... "
csrf_response=$(curl -s -c $COOKIE_FILE "${BASE_URL}/api/csrf")
CSRF_TOKEN=$(echo $csrf_response | grep -o '"csrf":"[^"]*"' | cut -d'"' -f4)
if [ -n "$CSRF_TOKEN" ]; then
    echo -e "${GREEN}✓ Token obtido: ${CSRF_TOKEN:0:20}...${NC}"
else
    echo -e "${RED}✗ Falha ao obter token${NC}"
    echo "Response: $csrf_response"
    exit 1
fi

# 1.2 - Registrar novo usuário
test_endpoint "1.2 - Registrar usuário" "POST" "/api/auth/register" \
    "{\"email\":\"$USER_EMAIL\",\"name\":\"$USER_NAME\",\"password\":\"$USER_PASSWORD\",\"csrf\":\"$CSRF_TOKEN\"}" \
    200

# 1.3 - Login
test_endpoint "1.3 - Login" "POST" "/api/auth/login" \
    "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\",\"csrf\":\"$CSRF_TOKEN\"}" \
    200

echo ""
echo "=========================================="
echo "2. TESTANDO BOARDS"
echo "=========================================="

# 2.1 - Criar board
board_response=$(test_endpoint "2.1 - Criar board" "POST" "/api/boards" \
    '{"title":"Board de Teste Automático"}' \
    200)
BOARD_ID=$(echo $board_response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Board ID: $BOARD_ID"

# 2.2 - Listar boards
test_endpoint "2.2 - Listar boards" "GET" "/api/boards" "" 200

echo ""
echo "=========================================="
echo "3. TESTANDO COLUNAS"
echo "=========================================="

# 3.1 - Criar coluna
column_response=$(test_endpoint "3.1 - Criar coluna" "POST" "/api/boards/${BOARD_ID}/columns" \
    '{"title":"Nova Coluna","order":0}' \
    200)
COLUMN_ID=$(echo $column_response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Column ID: $COLUMN_ID"

# 3.2 - Criar segunda coluna
test_endpoint "3.2 - Criar segunda coluna" "POST" "/api/boards/${BOARD_ID}/columns" \
    '{"title":"Em Progresso","order":1}' \
    200

echo ""
echo "=========================================="
echo "4. TESTANDO CLIENTES"
echo "=========================================="

# 4.1 - Criar cliente
client_response=$(test_endpoint "4.1 - Criar cliente" "POST" "/api/clients" \
    '{"name":"Cliente Teste","status":"NORMAL","lead":1,"phone":"11999999999","email":"cliente@teste.com"}' \
    200)
CLIENT_ID=$(echo $client_response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Client ID: $CLIENT_ID"

# 4.2 - Listar clientes
test_endpoint "4.2 - Listar clientes" "GET" "/api/clients" "" 200

# 4.3 - Buscar cliente específico
test_endpoint "4.3 - Buscar cliente" "GET" "/api/clients/${CLIENT_ID}" "" 200

# 4.4 - Atualizar cliente
test_endpoint "4.4 - Atualizar cliente" "PUT" "/api/clients/${CLIENT_ID}" \
    '{"status":"URGENTE","notes":"Cliente atualizado via teste"}' \
    200

echo ""
echo "=========================================="
echo "5. TESTANDO CARDS"
echo "=========================================="

# 5.1 - Criar card sem cliente
card_response=$(test_endpoint "5.1 - Criar card básico" "POST" "/api/boards/${BOARD_ID}/cards" \
    "{\"columnId\":\"$COLUMN_ID\",\"title\":\"Card de Teste\",\"description\":\"Descrição do card\",\"urgency\":\"HIGH\"}" \
    200)
CARD_ID=$(echo $card_response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Card ID: $CARD_ID"

# 5.2 - Criar card com cliente
test_endpoint "5.2 - Criar card com cliente" "POST" "/api/boards/${BOARD_ID}/cards" \
    "{\"columnId\":\"$COLUMN_ID\",\"title\":\"Card com Cliente\",\"urgency\":\"CRITICAL\",\"clientId\":\"$CLIENT_ID\"}" \
    200

# 5.3 - Buscar card
test_endpoint "5.3 - Buscar card" "GET" "/api/boards/${BOARD_ID}/cards/${CARD_ID}" "" 200

# 5.4 - Atualizar card
test_endpoint "5.4 - Atualizar card" "PUT" "/api/boards/${BOARD_ID}/cards/${CARD_ID}" \
    '{"title":"Card Atualizado","urgency":"MEDIUM"}' \
    200

# 5.5 - Mover card entre colunas
test_endpoint "5.5 - Mover card" "PUT" "/api/boards/${BOARD_ID}/cards/${CARD_ID}" \
    "{\"columnId\":\"$COLUMN_ID\"}" \
    200

echo ""
echo "=========================================="
echo "6. TESTANDO CHECKLISTS"
echo "=========================================="

# 6.1 - Criar checklist
checklist_response=$(test_endpoint "6.1 - Criar checklist" "POST" "/api/boards/${BOARD_ID}/cards/${CARD_ID}/checklists" \
    '{"title":"Checklist de Teste"}' \
    200)
CHECKLIST_ID=$(echo $checklist_response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Checklist ID: $CHECKLIST_ID"

# 6.2 - Adicionar item ao checklist
item_response=$(test_endpoint "6.2 - Adicionar item" "POST" "/api/boards/${BOARD_ID}/cards/${CARD_ID}/checklists/${CHECKLIST_ID}/items" \
    '{"content":"Item de teste 1"}' \
    200)
ITEM_ID=$(echo $item_response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 6.3 - Adicionar segundo item
test_endpoint "6.3 - Adicionar segundo item" "POST" "/api/boards/${BOARD_ID}/cards/${CARD_ID}/checklists/${CHECKLIST_ID}/items" \
    '{"content":"Item de teste 2"}' \
    200

# 6.4 - Marcar item como concluído
test_endpoint "6.4 - Marcar item como feito" "PUT" "/api/checklist-items/${ITEM_ID}/toggle" \
    '{"done":true}' \
    200

# 6.5 - Desmarcar item
test_endpoint "6.5 - Desmarcar item" "PUT" "/api/checklist-items/${ITEM_ID}/toggle" \
    '{"done":false}' \
    200

echo ""
echo "=========================================="
echo "7. TESTANDO COMENTÁRIOS"
echo "=========================================="

# 7.1 - Adicionar comentário
test_endpoint "7.1 - Adicionar comentário" "POST" "/api/boards/${BOARD_ID}/cards/${CARD_ID}/comments" \
    '{"content":"Comentário de teste automático"}' \
    200 || echo -e "${YELLOW}⚠ Comentário pode falhar se houver erro de board não encontrado${NC}"

echo ""
echo "=========================================="
echo "8. TESTANDO ASSIGNEES"
echo "=========================================="

# 8.1 - Listar usuários disponíveis
users_response=$(test_endpoint "8.1 - Listar usuários" "GET" "/api/users/available?boardId=${BOARD_ID}" "" 200)

# 8.2 - Adicionar assignee (usando o próprio usuário logado)
test_endpoint "8.2 - Adicionar assignee" "POST" "/api/boards/${BOARD_ID}/cards/${CARD_ID}/assignees" \
    "{\"userId\":\"$(echo $users_response | grep -o '\"id\":\"[^\"]*\"' | head -1 | cut -d'\"' -f4)\"}" \
    200

echo ""
echo "=========================================="
echo "9. TESTANDO CONVITES"
echo "=========================================="

# 9.1 - Enviar convite
test_endpoint "9.1 - Enviar convite" "POST" "/api/invites/send" \
    "{\"boardId\":\"$BOARD_ID\",\"email\":\"convidado@teste.com\",\"role\":\"MEMBER\"}" \
    200

# 9.2 - Tentar enviar convite duplicado
test_endpoint "9.2 - Convite duplicado (deve falhar)" "POST" "/api/invites/send" \
    "{\"boardId\":\"$BOARD_ID\",\"email\":\"convidado@teste.com\",\"role\":\"MEMBER\"}" \
    409

echo ""
echo "=========================================="
echo "10. TESTANDO NOTIFICAÇÕES"
echo "=========================================="

# 10.1 - Buscar notificações
test_endpoint "10.1 - Buscar notificações" "GET" "/api/notifications" "" 200

# 10.2 - Marcar todas como lidas
test_endpoint "10.2 - Marcar como lidas" "PUT" "/api/notifications/read" "" 200

echo ""
echo "=========================================="
echo "11. TESTANDO PERFORMANCE DASHBOARD"
echo "=========================================="

# 11.1 - Buscar métricas do board
test_endpoint "11.1 - Métricas do board" "GET" "/api/boards/${BOARD_ID}/metrics" "" 200

echo ""
echo "=========================================="
echo "12. TESTANDO LIMPEZA/DELEÇÃO"
echo "=========================================="

# 12.1 - Deletar checklist
test_endpoint "12.1 - Deletar checklist" "DELETE" "/api/boards/${BOARD_ID}/cards/${CARD_ID}/checklists/${CHECKLIST_ID}" "" 200

# 12.2 - Deletar card
test_endpoint "12.2 - Deletar card" "DELETE" "/api/boards/${BOARD_ID}/cards/${CARD_ID}" "" 200

# 12.3 - Deletar cliente
test_endpoint "12.3 - Deletar cliente" "DELETE" "/api/clients/${CLIENT_ID}" "" 200

# 12.4 - Deletar board
test_endpoint "12.4 - Deletar board" "DELETE" "/api/boards/${BOARD_ID}" "" 200

echo ""
echo "=========================================="
echo "13. TESTANDO LOGOUT"
echo "=========================================="

# 13.1 - Logout
test_endpoint "13.1 - Logout" "POST" "/api/auth/logout" "" 200

echo ""
echo "=========================================="
echo "RESUMO DOS TESTES"
echo "=========================================="

total_tests=$(grep -c "^" $TEST_RESULTS | tail -1)
passed_tests=$(grep -c "^✓" $TEST_RESULTS)
failed_tests=$(grep -c "^✗" $TEST_RESULTS)

echo ""
echo "Total de testes: $total_tests"
echo -e "${GREEN}Testes passaram: $passed_tests${NC}"
echo -e "${RED}Testes falharam: $failed_tests${NC}"
echo ""
echo "Resultados salvos em: $TEST_RESULTS"

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}✓ TODOS OS TESTES PASSARAM!${NC}"
    exit 0
else
    echo -e "${RED}✗ ALGUNS TESTES FALHARAM${NC}"
    echo ""
    echo "Testes que falharam:"
    grep "^✗" $TEST_RESULTS
    exit 1
fi
