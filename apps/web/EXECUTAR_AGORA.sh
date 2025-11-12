#!/bin/bash

echo "🚀 RESTAURAÇÃO DO BANCO - MÉTODO DEFINITIVO"
echo "============================================"
echo ""

# Pegar DATABASE_URL do Railway automaticamente
echo "🔍 Pegando credenciais atualizadas do Railway..."
DATABASE_URL=$(railway variables --service Postgres --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*"' | cut -d'"' -f4)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Não conseguiu pegar DATABASE_URL automaticamente"
    echo ""
    echo "📋 SOLUÇÃO MANUAL (2 passos):"
    echo ""
    echo "1️⃣  Pegar nova connection string:"
    echo "   railway variables --service Postgres | grep DATABASE_URL"
    echo ""
    echo "2️⃣  Executar com a string:"
    echo "   psql \"<COLE_A_URL_AQUI>\" -f RESTORE_DATABASE_COMPLETE.sql"
    echo ""
    exit 1
fi

echo "✅ Connection string obtida!"
echo ""

# Confirmar
echo "⚠️  Vai restaurar o banco (recriar tabelas)"
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

# Executar SQL
if psql "$DATABASE_URL" -f RESTORE_DATABASE_COMPLETE.sql 2>&1 | tail -30; then
    echo ""
    echo "✅ ================================================"
    echo "✅  BANCO RESTAURADO COM SUCESSO!"
    echo "✅ ================================================"
    echo ""

    # Verificar tabelas
    TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

    if [ ! -z "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 10 ]; then
        echo "📊 Total de tabelas: $TABLE_COUNT"
        echo ""
        echo "🎉 PRÓXIMOS PASSOS:"
        echo "   npm run seed:users-only"
        echo "   npm run dev"
        echo ""
    fi
else
    echo "❌ Erro na restauração"
    exit 1
fi
