#!/bin/bash

# Script para rodar migrations no Railway
# Execute este script após fazer login na Railway CLI

echo "🚀 Rodando Prisma migrations no Railway..."

cd apps/web

# Rodar migrations
railway run npx prisma migrate deploy

echo "✅ Migrations concluídas!"

# Opcional: Seed do banco
echo ""
echo "Deseja popular o banco com dados de teste? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    railway run npx prisma db seed
    echo "✅ Seed concluído!"
fi

echo ""
echo "🎉 Banco de dados configurado com sucesso!"