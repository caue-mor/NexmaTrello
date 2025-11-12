#!/bin/bash

echo "🚀 RESTAURAÇÃO AUTOMÁTICA DO BANCO RAILWAY"
echo "=========================================="
echo ""
echo "Este script vai restaurar todas as tabelas do banco."
echo ""

# Verificar se está na pasta correta
if [ ! -f "RESTORE_DATABASE_COMPLETE.sql" ]; then
    echo "❌ Erro: Execute este script na pasta apps/web"
    echo "   cd apps/web && ./EXECUTAR_ESTE_SCRIPT.sh"
    exit 1
fi

# Verificar Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado!"
    echo "📥 Instale com: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI encontrado"
echo ""

# Verificar autenticação
echo "🔐 Verificando autenticação..."
if ! railway whoami &> /dev/null; then
    echo ""
    echo "⚠️  Você precisa fazer login no Railway primeiro!"
    echo ""
    echo "Execute este comando em outra aba do terminal:"
    echo ""
    echo "    railway login"
    echo ""
    echo "Depois volte aqui e execute este script novamente."
    echo ""
    exit 1
fi

echo "✅ Autenticado no Railway!"
echo ""

# Link ao projeto (se necessário)
echo "🔗 Verificando link ao projeto..."
if ! railway status &> /dev/null 2>&1; then
    echo "⚠️  Precisa conectar ao projeto"
    echo ""
    read -p "Deseja conectar ao projeto NEXLIST agora? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        railway link
    else
        echo "❌ Cancelado. Execute 'railway link' manualmente"
        exit 1
    fi
fi

echo "✅ Conectado ao projeto!"
echo ""

# Confirmar
echo "📊 Projeto atual:"
railway status 2>/dev/null | head -5
echo ""
echo "⚠️  ATENÇÃO:"
echo "   Este script vai RECRIAR todas as tabelas"
echo "   O banco atual está vazio de qualquer forma"
echo ""
read -p "❓ Continuar com a restauração? (s/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado"
    exit 0
fi

echo ""
echo "🔧 Executando restauração..."
echo "⏳ Isso vai levar ~30-60 segundos..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Executar SQL via Railway CLI
if railway run psql -f RESTORE_DATABASE_COMPLETE.sql 2>&1 | tail -30; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ ============================================="
    echo "✅  BANCO RESTAURADO COM SUCESSO!"
    echo "✅ ============================================="
    echo ""

    # Verificar tabelas
    echo "📊 Verificando tabelas criadas..."
    TABLE_COUNT=$(railway run psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

    if [ ! -z "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
        echo "✅ Total de tabelas criadas: $TABLE_COUNT"
        echo ""

        echo "📋 Algumas tabelas criadas:"
        railway run psql -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name LIMIT 8;" 2>/dev/null | sed 's/^/   ✓ /'

        echo ""
        echo "🎉 PRÓXIMOS PASSOS:"
        echo ""
        echo "1️⃣  Criar usuários de teste:"
        echo "   npm run seed:users-only"
        echo ""
        echo "2️⃣  Criar board geral:"
        echo "   npm run add:general"
        echo ""
        echo "3️⃣  Testar localmente:"
        echo "   npm run dev"
        echo "   Login: alice@nexma.com / senha123"
        echo ""
        echo "4️⃣  Deploy (se funcionou local):"
        echo "   git add . && git commit -m 'fix: restaurar banco' && git push"
        echo ""
    else
        echo "⚠️  Não foi possível verificar tabelas automaticamente"
        echo "💡 Verifique manualmente no Railway (Postgres > Data)"
    fi

else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "❌ ============================================="
    echo "❌  ERRO NA RESTAURAÇÃO"
    echo "❌ ============================================="
    echo ""
    echo "💡 Possíveis soluções:"
    echo "   1. Verifique se está no projeto correto: railway status"
    echo "   2. Tente reconectar: railway link"
    echo "   3. Verifique os logs acima para detalhes do erro"
    echo ""
    exit 1
fi
