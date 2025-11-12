#!/bin/bash

# ============================================
# Script Simples de Restauração do Banco
# ============================================

echo "🚀 Restaurador de Banco NexList"
echo "================================"
echo ""
echo "📋 Você vai precisar da CONNECTION STRING do Railway"
echo "💡 Para pegar:"
echo "   1. Acesse https://railway.app"
echo "   2. Abra o projeto NexmaTrello"
echo "   3. Clique em 'Postgres'"
echo "   4. Vá em 'Connect'"
echo "   5. Copie a 'Postgres Connection URL'"
echo ""
echo "Exemplo:"
echo "postgresql://postgres:senha123@containers-xx.railway.app:5432/railway"
echo ""

# Pedir connection string
read -p "🔗 Cole a CONNECTION STRING aqui: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Connection string não fornecida!"
    exit 1
fi

echo ""
echo "✅ Connection string recebida!"
echo "📊 Banco: ${DATABASE_URL:0:40}..."
echo ""

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ psql não encontrado!"
    echo ""
    echo "📥 Instalação:"
    echo "   Mac: brew install postgresql"
    echo "   Ubuntu: sudo apt install postgresql-client"
    echo "   Windows: https://www.postgresql.org/download/windows/"
    echo ""
    exit 1
fi

# Verificar se arquivo SQL existe
if [ ! -f "RESTORE_DATABASE_COMPLETE.sql" ]; then
    echo "❌ Arquivo RESTORE_DATABASE_COMPLETE.sql não encontrado!"
    echo "💡 Certifique-se de estar na pasta apps/web"
    exit 1
fi

# Confirmar
echo "⚠️  ATENÇÃO:"
echo "   Este script vai RECRIAR todas as tabelas"
echo "   Dados existentes serão perdidos (o banco já está vazio)"
echo ""
read -p "❓ Continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado"
    exit 0
fi

echo ""
echo "🔧 Executando restauração..."
echo "⏳ Aguarde 30-60 segundos..."
echo ""
echo "----------------------------------------"

# Executar SQL
if psql "$DATABASE_URL" < RESTORE_DATABASE_COMPLETE.sql 2>&1 | grep -v "^INSERT" | grep -v "^NOTICE" | tail -20; then
    echo "----------------------------------------"
    echo ""
    echo "✅ ================================================"
    echo "✅  RESTAURAÇÃO CONCLUÍDA!"
    echo "✅ ================================================"
    echo ""

    # Verificar tabelas
    echo "📊 Verificando tabelas criadas..."
    TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

    if [ ! -z "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
        echo "✅ Total de tabelas: $TABLE_COUNT"
        echo ""

        # Listar algumas tabelas
        echo "📋 Principais tabelas criadas:"
        psql "$DATABASE_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name LIMIT 10;" 2>/dev/null | sed 's/^/   - /'

        echo ""
        echo "🎉 PRÓXIMOS PASSOS:"
        echo "   1. Criar usuários de teste:"
        echo "      npm run seed:users-only"
        echo ""
        echo "   2. Criar board geral:"
        echo "      npm run add:general"
        echo ""
        echo "   3. Testar aplicação:"
        echo "      npm run dev"
        echo ""
        echo "   4. Login: alice@nexma.com / senha123"
        echo ""
    else
        echo "⚠️  Não foi possível verificar tabelas"
        echo "💡 Verifique manualmente no Railway UI"
    fi

else
    echo "----------------------------------------"
    echo ""
    echo "❌ ================================================"
    echo "❌  ERRO NA RESTAURAÇÃO"
    echo "❌ ================================================"
    echo ""
    echo "💡 Possíveis soluções:"
    echo "   1. Verifique a connection string"
    echo "   2. Verifique se o banco está acessível"
    echo "   3. Tente via Railway UI (mais fácil):"
    echo "      Leia: RESTAURAR_RAILWAY_PASSO_A_PASSO.md"
    echo ""
    exit 1
fi
