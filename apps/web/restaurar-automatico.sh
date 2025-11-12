#!/bin/bash

# ============================================
# RESTAURAÇÃO 100% AUTOMÁTICA DO BANCO RAILWAY
# Sem precisar de autenticação manual!
# ============================================

echo "🚀 RESTAURAÇÃO AUTOMÁTICA DO BANCO"
echo "===================================="
echo ""

# Connection string do Railway (já fornecida)
export PGPASSWORD='mQDCJpCkILsxdLVZwzDFwvQxpAzZjjJZ'
HOST="interchange.proxy.rlwy.net"
PORT="19800"
USER="postgres"
DATABASE="railway"

echo "🔗 Conectando ao Railway..."
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   Database: $DATABASE"
echo ""

# Verificar se psql existe
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) não encontrado!"
    echo ""
    echo "📥 Instalação:"
    echo "   Mac: brew install libpq"
    echo "   Depois: export PATH=\"/opt/homebrew/opt/libpq/bin:\$PATH\""
    echo ""
    echo "   Ou use: brew install postgresql"
    echo ""
    exit 1
fi

# Verificar se arquivo SQL existe
if [ ! -f "RESTORE_DATABASE_COMPLETE.sql" ]; then
    echo "❌ Arquivo SQL não encontrado!"
    echo "   Execute na pasta: apps/web"
    exit 1
fi

# Testar conexão primeiro
echo "🔍 Testando conexão..."
if psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Conexão OK!"
else
    echo "❌ Falha na conexão!"
    echo ""
    echo "💡 Possíveis causas:"
    echo "   1. Senha mudou (verifique no Railway)"
    echo "   2. IP bloqueado (precisa autorizar no Railway)"
    echo "   3. Banco pausado (inicie no Railway)"
    echo ""
    echo "🔧 Solução: Use o método manual via Railway UI"
    echo "   Leia: RESTAURAR_RAILWAY_PASSO_A_PASSO.md"
    echo ""
    exit 1
fi

echo ""
echo "⚠️  ATENÇÃO: Vai recriar todas as tabelas"
echo ""
read -p "❓ Continuar? (s/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado"
    exit 0
fi

echo ""
echo "🔧 Executando SQL..."
echo "⏳ Aguarde 30-60 segundos..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Executar SQL com tratamento de erro melhorado
if psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" -f RESTORE_DATABASE_COMPLETE.sql 2>&1 | tee /tmp/restore_output.log | tail -30; then

    # Verificar se realmente funcionou
    TABLE_COUNT=$(psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if [ ! -z "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 10 ]; then
        echo "✅ ================================================"
        echo "✅  BANCO RESTAURADO COM SUCESSO!"
        echo "✅ ================================================"
        echo ""
        echo "📊 Total de tabelas: $TABLE_COUNT"
        echo ""

        echo "📋 Tabelas criadas:"
        psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" -t -c "SELECT '   ✓ ' || table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name LIMIT 10;"

        echo ""
        echo "🎉 PRÓXIMOS PASSOS:"
        echo ""
        echo "1️⃣  Criar usuários:"
        echo "   npm run seed:users-only"
        echo ""
        echo "2️⃣  Testar local:"
        echo "   npm run dev"
        echo "   Login: alice@nexma.com / senha123"
        echo ""

    else
        echo "⚠️ ================================================"
        echo "⚠️  POSSÍVEL ERRO - Verificação falhou"
        echo "⚠️ ================================================"
        echo ""
        echo "Tabelas encontradas: ${TABLE_COUNT:-0}"
        echo ""
        echo "💡 Verifique o log: /tmp/restore_output.log"
        echo "💡 Ou tente manualmente via Railway UI"
    fi

else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "❌ ================================================"
    echo "❌  ERRO NA EXECUÇÃO"
    echo "❌ ================================================"
    echo ""
    echo "💡 Verifique o log: /tmp/restore_output.log"
    echo ""
    exit 1
fi
