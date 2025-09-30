#!/bin/bash

# Deploy Helper Script para NexmaTrello
# Criado com Claude Code

echo "🚀 Deploy Helper - NexmaTrello"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para printar com cor
print_green() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_blue() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_yellow() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_red() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "DEPLOY.md" ]; then
    print_red "Execute este script da raiz do projeto TrelloNexma!"
    exit 1
fi

echo "📋 Este script vai te ajudar a fazer o deploy do NexmaTrello"
echo ""
echo "Você precisará criar contas em (se ainda não tem):"
echo "  - Neon (PostgreSQL): https://neon.tech"
echo "  - Upstash (Redis): https://upstash.com"
echo "  - Vercel: https://vercel.com"
echo ""

read -p "Pressione Enter para continuar..."

# Passo 1: Verificar Vercel CLI
echo ""
print_blue "Passo 1: Verificando Vercel CLI..."

if ! command -v vercel &> /dev/null; then
    print_red "Vercel CLI não encontrado!"
    echo "Instalando Vercel CLI..."
    npm install -g vercel
    print_green "Vercel CLI instalado!"
else
    print_green "Vercel CLI já instalado!"
fi

# Passo 2: Coletar credenciais
echo ""
print_blue "Passo 2: Coletando credenciais..."
echo ""

# DATABASE_URL
echo "📊 PostgreSQL (Neon)"
echo "Acesse: https://neon.tech"
echo "Crie um projeto e copie a Connection String"
echo ""
read -p "Cole sua DATABASE_URL do Neon: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    print_red "DATABASE_URL não pode ser vazia!"
    exit 1
fi

echo ""

# REDIS_URL
echo "⚡ Redis (Upstash)"
echo "Acesse: https://upstash.com"
echo "Crie um database e copie a REST URL"
echo ""
read -p "Cole sua REDIS_URL do Upstash: " REDIS_URL

if [ -z "$REDIS_URL" ]; then
    print_red "REDIS_URL não pode ser vazia!"
    exit 1
fi

echo ""

# NEXTAUTH_SECRET
echo "🔐 Gerando NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
print_green "Secret gerado: $NEXTAUTH_SECRET"
echo ""

# Salvar credenciais em arquivo temporário
cat > /tmp/nexmatrello-env.txt <<EOF
DATABASE_URL=$DATABASE_URL
REDIS_URL=$REDIS_URL
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
EOF

print_green "Credenciais salvas em /tmp/nexmatrello-env.txt"
echo ""

# Passo 3: Login na Vercel
echo ""
print_blue "Passo 3: Login na Vercel..."
echo "Uma janela do navegador vai abrir para você fazer login"
echo ""

cd apps/web

vercel login

if [ $? -ne 0 ]; then
    print_red "Erro ao fazer login na Vercel!"
    exit 1
fi

print_green "Login realizado com sucesso!"
echo ""

# Passo 4: Primeiro Deploy
echo ""
print_blue "Passo 4: Fazendo primeiro deploy..."
echo ""
print_yellow "A Vercel vai fazer algumas perguntas. Responda:"
print_yellow "  - Set up and deploy? → Y"
print_yellow "  - Which scope? → Sua conta pessoal"
print_yellow "  - Link to existing? → N"
print_yellow "  - Project name? → nexmatrello (ou outro nome)"
print_yellow "  - Directory? → Pressione Enter"
echo ""

vercel

if [ $? -ne 0 ]; then
    print_red "Erro no primeiro deploy!"
    exit 1
fi

print_green "Primeiro deploy concluído!"
echo ""

# Capturar URL da Vercel
echo "Aguarde enquanto obtenemos a URL do projeto..."
sleep 3

VERCEL_URL=$(vercel ls | grep "nexmatrello" | awk '{print $2}' | head -1)

if [ -z "$VERCEL_URL" ]; then
    echo ""
    read -p "Cole a URL que a Vercel gerou (ex: nexmatrello-xxx.vercel.app): " VERCEL_URL
fi

NEXTAUTH_URL="https://$VERCEL_URL"

echo ""
print_green "URL da Vercel: $NEXTAUTH_URL"

# Adicionar ao arquivo de env
echo "NEXTAUTH_URL=$NEXTAUTH_URL" >> /tmp/nexmatrello-env.txt

echo ""

# Passo 5: Configurar variáveis
echo ""
print_blue "Passo 5: Configurando variáveis de ambiente..."
echo ""
print_yellow "Agora você precisa adicionar as variáveis no dashboard da Vercel:"
echo ""
echo "1. Acesse: https://vercel.com"
echo "2. Vá em seu projeto 'nexmatrello'"
echo "3. Clique em Settings → Environment Variables"
echo "4. Adicione estas variáveis:"
echo ""
cat /tmp/nexmatrello-env.txt
echo ""
print_yellow "⚠️  IMPORTANTE: Marque as 3 checkboxes (Production, Preview, Development) para cada!"
echo ""

read -p "Pressione Enter quando terminar de adicionar as variáveis..."

# Passo 6: Migrations
echo ""
print_blue "Passo 6: Rodando migrations no banco..."
echo ""

export DATABASE_URL="$DATABASE_URL"

npx prisma migrate deploy

if [ $? -ne 0 ]; then
    print_red "Erro ao rodar migrations!"
    print_yellow "Tente rodar manualmente: export DATABASE_URL='...' && npx prisma migrate deploy"
else
    print_green "Migrations executadas com sucesso!"
fi

echo ""

# Perguntar se quer popular com dados de teste
read -p "Deseja popular o banco com dados de teste? (y/n): " SEED_DB

if [ "$SEED_DB" = "y" ]; then
    echo "Populando banco de dados..."
    npx prisma db seed

    if [ $? -eq 0 ]; then
        print_green "Banco populado com sucesso!"
    else
        print_yellow "Erro ao popular banco (não crítico)"
    fi
fi

echo ""

# Passo 7: Deploy em produção
echo ""
print_blue "Passo 7: Deploy final em produção..."
echo ""

vercel --prod

if [ $? -ne 0 ]; then
    print_red "Erro no deploy em produção!"
    exit 1
fi

echo ""
print_green "================================"
print_green "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
print_green "================================"
echo ""
echo "Seu app está no ar em:"
echo "  🌐 $NEXTAUTH_URL"
echo ""
echo "Credenciais salvas em: /tmp/nexmatrello-env.txt"
echo ""
echo "Próximos passos:"
echo "  1. Abra a URL no navegador"
echo "  2. Registre um novo usuário"
echo "  3. Faça login"
echo "  4. Crie seu primeiro board!"
echo ""
print_blue "Para ver os logs: vercel logs --follow"
print_blue "Para fazer novo deploy: git push origin main (automático!)"
echo ""

# Abrir no navegador
read -p "Deseja abrir o app no navegador agora? (y/n): " OPEN_BROWSER

if [ "$OPEN_BROWSER" = "y" ]; then
    open "$NEXTAUTH_URL" 2>/dev/null || xdg-open "$NEXTAUTH_URL" 2>/dev/null || echo "Abra manualmente: $NEXTAUTH_URL"
fi

echo ""
print_green "Obrigado por usar o Deploy Helper! 🚀"