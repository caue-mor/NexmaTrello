# 🎮 Sistema de Gamificação NexList

**Status**: ✅ IMPLEMENTADO E FUNCIONANDO

Sistema completo de gamificação para motivar usuários do NexList com XP, níveis, conquistas e moedas.

---

## 📊 O Que Foi Implementado

### 1. Sistema de XP e Níveis

**Como Funciona**:
- Usuários ganham XP ao completar tarefas
- XP acumula e faz você subir de nível
- Fórmula: `XP necessário = 100 × (nível ^ 1.5)`

**Como Ganhar XP**:
| Ação | XP Base | Observações |
|------|---------|-------------|
| ✅ Completar item de checklist | **+10 XP** | Por cada item |
| 🎯 Completar card inteiro | **+50 XP** | Quando todos os items estão done |
| ⏰ Completar no prazo | **+50 XP bônus** | Se dueAt ainda não passou |
| 🔴 Card crítico | **2x multiplicador** | Urgência CRITICAL dobra o XP |

**Exemplos**:
- Completar 1 item normal = 10 XP
- Completar 1 item de card crítico = 20 XP
- Completar card de 5 items no prazo = 10×5 + 50 + 50 = **150 XP**
- Completar card crítico de 3 items = (10×3 + 50) × 2 = **160 XP**

### 2. Sistema de Moedas 💰

**Como Funciona**:
- **1 moeda a cada 10 XP** ganhos
- **Bônus de streak**: +10 moedas a cada 7 dias consecutivos
- **Por enquanto**: Moedas apenas acumulam (sem loja)

**Uso Futuro**:
- Comprar temas personalizados
- Desbloquear avatares
- Trocar por recompensas

### 3. Sistema de Streak (Sequência) 🔥

**Como Funciona**:
- Conta dias consecutivos com atividade
- Qualquer ação conta: completar tarefa, criar card, etc.
- Se passar 1 dia sem ação, streak volta para 1

**Bônus**:
- A cada 7 dias: +10 moedas
- Achievements especiais por streaks longas

### 4. Conquistas (Achievements) 🏆

**10 Conquistas Disponíveis**:

#### 🎯 Tarefas (4 conquistas)
1. **Primeiro Passo** - Complete sua primeira tarefa
   - Recompensa: 10 XP + 5 moedas

2. **Produtivo** - Complete 10 tarefas
   - Recompensa: 50 XP + 10 moedas

3. **Veterano** - Complete 100 tarefas
   - Recompensa: 200 XP + 50 moedas

4. **Mestre das Tarefas** - Complete 500 tarefas
   - Recompensa: 500 XP + 100 moedas

#### ⏰ Pontualidade (1 conquista)
5. **Pontual** - Complete 10 tarefas no prazo
   - Recompensa: 100 XP + 20 moedas

#### 🔥 Sequência (3 conquistas)
6. **Sequência de Fogo** - Mantenha 7 dias consecutivos
   - Recompensa: 100 XP + 25 moedas

7. **Dedicado** - Mantenha 30 dias consecutivos
   - Recompensa: 500 XP + 100 moedas

8. **Lenda** - Mantenha 100 dias consecutivos
   - Recompensa: 1000 XP + 200 moedas

#### ⭐ Especiais (2 conquistas)
9. **Perfeccionista** - Complete 5 cards com 100% das tarefas
   - Recompensa: 50 XP + 15 moedas

10. **Urgente** - Complete 5 cards críticos
    - Recompensa: 150 XP + 30 moedas

---

## 🎨 Interface Visual

### 1. Dashboard - Stats Widget (Topo da Página)

**Mostra**:
- 🏆 Nível atual ("Nível 12")
- 📊 Barra de progresso de XP (com porcentagem)
- 💰 Moedas acumuladas
- 🔥 Streak atual (dias consecutivos)
- ✅ Total de tarefas concluídas

**Design**:
- Card com gradiente azul/roxo
- Animações suaves ao passar o mouse
- Responsivo (adapta para mobile)

### 2. Dashboard - Painel de Conquistas (Final da Página)

**Mostra**:
- Grid de todas as conquistas (2 colunas mobile, 3 desktop)
- Conquistas desbloqueadas: fundo amarelo/laranja
- Conquistas bloqueadas: cinza com opacidade
- Progresso: "X de 10 desbloqueadas"

**Agrupamento**:
- Por categoria: Tarefas, Pontualidade, Sequência, Especiais

### 3. Navbar - Badges

**Mostra no topo**:
- Badge "Nv. X" com ícone de troféu
- Badge com quantidade de moedas
- Link "Progresso" no menu

### 4. Página /gamification

**Tela dedicada com**:
- Stats Widget expandido
- Guia "Como Ganhar XP"
- Painel completo de conquistas
- Todas as estatísticas detalhadas

### 5. Celebrações 🎉

**Quando sobe de nível**:
- Modal com confete animado (5 segundos)
- Troféu gigante com estrelas rotacionando
- Número do novo nível em destaque
- Moedas ganhas

**Quando desbloqueia conquista**:
- Toast customizado amarelo/laranja
- "🎉 Conquista Desbloqueada!"
- Nome, descrição e XP ganhado
- Animação de entrada pela direita

---

## 🗄️ Banco de Dados

### Tabelas Criadas

#### UserStats
```typescript
{
  id: string
  userId: string         // Relação com User
  totalXp: number        // XP total acumulado
  level: number          // Nível calculado
  coins: number          // Moedas acumuladas
  currentStreak: number  // Dias consecutivos atuais
  longestStreak: number  // Maior sequência já alcançada
  lastActiveAt: DateTime // Última atividade (para streak)
  tasksCompleted: number // Total de tarefas completadas
  tasksCompletedOnTime: number // Tarefas no prazo
  cardsCompleted: number // Cards completos
  criticalCardsCompleted: number // Cards críticos completos
}
```

#### UserAchievement
```typescript
{
  id: string
  userId: string         // Relação com User
  achievementKey: string // "first_task", "veteran_100", etc
  unlockedAt: DateTime   // Quando foi desbloqueada
}
```

**Importante**:
- Achievements são hardcoded no código (não no banco)
- Apenas os **desbloqueios** são salvos
- Isso permite adicionar novos achievements facilmente

---

## 🔧 Como Funciona (Técnico)

### Fluxo de Award XP

**Quando um checklist item é marcado como done**:

1. ✅ API recebe requisição em `/api/checklist-items/[itemId]`
2. 📝 Marca item como done no banco
3. 🎮 Chama `awardXp(userId, "checklist_item")`
4. 🔍 Verifica se TODOS os items do card estão done
5. 🎯 Se sim:
   - Move card para coluna "Finalizado"
   - Calcula XP do card (base + bônus + multiplicador)
   - Incrementa estatísticas
6. 🔥 Atualiza streak (dias consecutivos)
7. 🏆 Verifica novos achievements desbloqueados
8. 💰 Calcula moedas ganhas
9. 📊 Calcula se levelou up
10. 📤 Retorna resposta com objeto `gamification`:

```typescript
{
  gamification: {
    xpGained: 160,           // XP ganho nessa ação
    leveledUp: true,         // Se subiu de nível
    oldLevel: 11,            // Nível anterior
    newLevel: 12,            // Novo nível
    coinsGained: 16,         // Moedas ganhas
    newAchievements: [       // Conquistas desbloqueadas
      "productive_10",
      "punctual_10"
    ],
    streakInfo: {
      currentStreak: 8,      // Dias consecutivos
      coinsAwarded: 0        // Moedas de bônus
    }
  }
}
```

### Frontend - Reação ao Award

**No CardModal.tsx**:
1. Recebe resposta da API
2. Se `leveledUp === true`: Mostra LevelUpModal com confete
3. Se `newAchievements.length > 0`: Mostra toast para cada uma
4. Mostra toast "+X XP ganho!"
5. Atualiza UI automaticamente

---

## 📂 Arquivos Criados/Modificados

### Backend (9 arquivos)

**Lógica de Gamificação** (`apps/web/lib/gamification/`):
- `xp-system.ts` - Cálculos de XP e level
- `achievements.ts` - Definição das 10 conquistas
- `streak-system.ts` - Sistema de dias consecutivos
- `award-xp.ts` - Função principal de dar XP
- `index.ts` - Exports centralizados

**API Routes**:
- `app/api/stats/me/route.ts` - GET stats do usuário
- `app/api/achievements/me/route.ts` - GET achievements

**Hooks React**:
- `lib/hooks/use-user-stats.ts` - Hook para consumir stats
- `lib/hooks/use-achievements.ts` - Hook para consumir achievements

### Frontend (8 arquivos)

**Componentes de Gamificação** (`apps/web/components/gamification/`):
- `StatsWidget.tsx` - Widget de stats no dashboard
- `AchievementsPanel.tsx` - Grid de conquistas
- `LevelUpModal.tsx` - Modal de celebração (level up)
- `AchievementToast.tsx` - Toast de nova conquista

**Integrações**:
- `app/(protected)/dashboard/page.tsx` - Adicionado StatsWidget e AchievementsPanel
- `app/(protected)/dashboard/ClientDashboard.tsx` - Client component para hooks
- `app/(protected)/gamification/page.tsx` - Nova página dedicada
- `components/boards/CardModal.tsx` - Integração com awards
- `components/shared/Navbar.tsx` - Badges de level e moedas

### Database

**Schema Prisma** (`apps/web/prisma/schema.prisma`):
- Adicionado model `UserStats`
- Adicionado model `UserAchievement`
- Adicionado relations em `User`

**Migration**:
- `20251112212938_add_gamification_system` ✅ Aplicada

### Scripts

**Inicialização** (`apps/web/scripts/`):
- `init-user-stats.ts` - Cria UserStats para usuários existentes
- Comando: `npm run init:stats`

---

## 🚀 Como Usar

### Para Usuários

1. **Acesse o dashboard**: Stats aparecem automaticamente no topo
2. **Complete tarefas**: Marque checklist items como done
3. **Veja seu progresso**: Barra de XP aumenta, moedas acumulam
4. **Celebre conquistas**: Modais e toasts aparecem automaticamente
5. **Veja detalhes**: Acesse `/gamification` ou clique em "Progresso" no menu

### Para Desenvolvedores

#### Consultar Stats de um Usuário

**API**:
```bash
GET /api/stats/me
```

**Response**:
```json
{
  "id": "...",
  "userId": "...",
  "totalXp": 2450,
  "level": 12,
  "coins": 245,
  "currentStreak": 15,
  "longestStreak": 30,
  "tasksCompleted": 127,
  "tasksCompletedOnTime": 98,
  "cardsCompleted": 23,
  "criticalCardsCompleted": 5,
  "xpProgress": {
    "level": 12,
    "currentLevelXp": 450,
    "nextLevelXp": 1000,
    "progressPercent": 45
  }
}
```

#### Consultar Achievements

**API**:
```bash
GET /api/achievements/me
```

**Response**:
```json
{
  "achievements": [
    {
      "key": "first_task",
      "title": "Primeiro Passo",
      "description": "Complete sua primeira tarefa",
      "icon": "CheckCircle",
      "xpReward": 10,
      "coinReward": 5,
      "category": "tasks",
      "unlocked": true,
      "unlockedAt": "2025-11-12T20:30:00Z"
    },
    // ... mais 9 achievements
  ],
  "totalUnlocked": 3,
  "totalAvailable": 10
}
```

#### Usar Hooks nos Componentes

```typescript
import { useUserStats } from '@/lib/hooks/use-user-stats';
import { useAchievements } from '@/lib/hooks/use-achievements';

function MeuComponente() {
  const { stats, loading, error, refetch } = useUserStats();
  const { achievements, stats: achievementStats, loading: loadingAch } = useAchievements();

  if (loading) return <Skeleton />;

  return (
    <div>
      <p>Nível: {stats?.level}</p>
      <p>XP: {stats?.totalXp}</p>
      <p>Moedas: {stats?.coins}</p>
      <p>Conquistas: {achievementStats.totalUnlocked}/{achievementStats.totalAvailable}</p>
    </div>
  );
}
```

---

## ✅ Status de Implementação

### CONCLUÍDO ✅

- [x] Schema Prisma com UserStats e UserAchievement
- [x] Migration aplicada no banco de dados
- [x] Sistema de XP e níveis funcionando
- [x] Sistema de moedas (1 moeda a cada 10 XP)
- [x] Sistema de streak (dias consecutivos)
- [x] 10 achievements definidos e funcionais
- [x] API routes `/api/stats/me` e `/api/achievements/me`
- [x] Hooks React para consumir APIs
- [x] Integração com checklist items (award XP automático)
- [x] StatsWidget no dashboard
- [x] AchievementsPanel no dashboard
- [x] LevelUpModal com confete
- [x] AchievementToast customizado
- [x] Badges na Navbar
- [x] Página `/gamification` dedicada
- [x] Script de inicialização de stats
- [x] Build de produção validado
- [x] Documentação completa

### DESIGN SYSTEM ✅

- [x] SVGs profissionais (lucide-react, sem emojis)
- [x] Gradientes azul/roxo para XP
- [x] Amarelo/laranja para conquistas
- [x] Animações com Framer Motion
- [x] Responsivo (mobile-first)
- [x] Loading states (Skeleton)
- [x] Celebrações animadas (confete, modals, toasts)

---

## 🎯 Objetivos Alcançados

✅ **Motivação Individual**: Cada usuário vê seu próprio progresso
✅ **Sem Ranking**: Não há competição entre usuários (trabalho em equipe)
✅ **Visual e Animado**: Celebrações, confete, toasts, animações
✅ **Profissional**: SVGs da lucide-react, sem emojis
✅ **Intuitivo**: Stats sempre visíveis, feedback imediato
✅ **Automático**: XP dado automaticamente ao completar tarefas
✅ **Extensível**: Fácil adicionar novos achievements e features

---

## 📈 Próximos Passos (Futuro)

### Fase 2 - Loja de Recompensas 🛍️
- [ ] Criar tabela `Reward` (avatares, temas, badges)
- [ ] Implementar sistema de compra com moedas
- [ ] UI para loja de recompensas
- [ ] Sistema de inventário do usuário

### Fase 3 - Personalização 🎨
- [ ] Avatares customizáveis
- [ ] Temas de cores personalizados
- [ ] Frames e badges para perfil
- [ ] Títulos desbloqueáveis

### Fase 4 - Social 👥
- [ ] Ver conquistas de outros usuários (sem ranking)
- [ ] Conquistas de equipe/board
- [ ] Achievements colaborativos
- [ ] Celebrações em grupo

### Fase 5 - Análise 📊
- [ ] Gráficos de progresso ao longo do tempo
- [ ] Relatórios de produtividade
- [ ] Insights sobre padrões de trabalho
- [ ] Sugestões de melhoria

---

## 🐛 Troubleshooting

### Stats não aparecem

**Solução**:
```bash
npm run init:stats
```

### Erro ao dar XP

**Verificar**:
1. UserStats existe para o usuário? (`npm run init:stats`)
2. Prisma Client foi regenerado? (`npx prisma generate`)
3. Migration foi aplicada? (`npx prisma migrate status`)

### Build falhou

**Verificar**:
1. `react-confetti` instalado? (`npm install react-confetti`)
2. Tipos corretos importados?
3. Rodar `npm run build` e verificar erros específicos

### Achievements não aparecem

**Verificar**:
1. API `/api/achievements/me` funciona?
2. Hook `useAchievements()` está sendo usado?
3. Usuário tem stats inicializados?

---

## 📚 Documentação Adicional

**Arquivos de documentação criados**:
- `GAMIFICATION_IMPLEMENTATION.md` - Documentação técnica detalhada (backend)
- `GAMIFICATION_COMPONENTS.md` - Documentação de componentes (frontend)
- `GAMIFICATION_SYSTEM.md` - Este arquivo (visão geral)

---

## 🎉 Conclusão

Sistema de gamificação **100% implementado e funcional**!

**Destaques**:
- ✅ Backend completo com XP, levels, coins, streaks, achievements
- ✅ Frontend bonito com animações e celebrações
- ✅ Integração automática (XP dado ao completar tarefas)
- ✅ Design profissional (SVGs, gradientes, responsivo)
- ✅ Foco em motivação individual (sem competição)
- ✅ Extensível (fácil adicionar features)

**Pronto para uso em produção!** 🚀

---

**Desenvolvido para NexList - Sistema Interno Nexma**
**Data**: 12 de Novembro de 2025
**Versão**: 1.0.0
