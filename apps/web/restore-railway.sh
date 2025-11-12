#!/bin/bash

# ============================================
# Script de Restauração Automática - Railway
# ============================================

echo "🚀 Iniciando restauração do banco NexList..."
echo ""

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado!"
    echo "📥 Instale com: npm install -g @railway/cli"
    exit 1
fi

# Verificar autenticação
echo "🔐 Verificando autenticação..."
if ! railway whoami &> /dev/null; then
    echo "⚠️  Você não está autenticado no Railway"
    echo "🔑 Fazendo login..."
    railway login

    if [ $? -ne 0 ]; then
        echo "❌ Falha no login. Execute manualmente: railway login"
        exit 1
    fi
fi

echo "✅ Autenticado no Railway!"
echo ""

# Listar projetos
echo "📋 Projetos disponíveis:"
railway list
echo ""

# Link ao projeto (se ainda não estiver)
echo "🔗 Conectando ao projeto..."
railway link
echo ""

# Buscar DATABASE_URL
echo "🔍 Buscando connection string do banco..."
DATABASE_URL=$(railway variables get DATABASE_URL 2>/dev/null)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não encontrada!"
    echo "💡 Dica: Certifique-se de estar no projeto correto"
    echo "   Execute: railway link"
    exit 1
fi

echo "✅ Connection string encontrada!"
echo ""

# Confirmar
echo "⚠️  ATENÇÃO: Este script irá recriar TODAS as tabelas"
echo "📊 Banco atual: ${DATABASE_URL:0:50}..."
echo ""
read -p "❓ Deseja continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado pelo usuário"
    exit 0
fi

echo ""
echo "🔧 Executando script de restauração..."
echo "⏳ Isso pode levar 30-60 segundos..."
echo ""

# Executar SQL
if psql "$DATABASE_URL" < RESTORE_DATABASE_COMPLETE.sql; then
    echo ""
    echo "✅ ================================================"
    echo "✅  BANCO RESTAURADO COM SUCESSO!"
    echo "✅ ================================================"
    echo ""
    echo "📊 Verificando tabelas criadas..."

    # Contar tabelas
    TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

    echo "✅ Total de tabelas: $TABLE_COUNT"
    echo ""
    echo "🎉 Próximos passos:"
    echo "   1. Criar usuários de teste: npm run seed:users-only"
    echo "   2. Criar board geral: npm run add:general"
    echo "   3. Testar aplicação: npm run dev"
    echo ""
else
    echo ""
    echo "❌ ================================================"
    echo "❌  ERRO AO RESTAURAR BANCO"
    echo "❌ ================================================"
    echo ""
    echo "💡 Soluções:"
    echo "   1. Verifique se psql está instalado: psql --version"
    echo "   2. Verifique a connection string"
    echo "   3. Execute manualmente via Railway UI"
    echo ""
    exit 1
fi
