# 🎮 Sistema de Gamificação em Equipe - NexList

## 📊 Visão Geral

Sistema de pontuação colaborativa que recompensa tanto **contribuições individuais** quanto **trabalho em equipe**.

---

## 🎯 Regras de Atribuição e Pontuação

### **1. Cards SEM Atribuição**
```
Comportamento: Qualquer membro do board pode marcar tarefas
Pontuação: Quem marca a tarefa ganha os pontos
Uso: Cards gerais, tarefas rápidas
```

### **2. Cards COM 1 Assignee**
```
Comportamento: Apenas o assignee pode ganhar XP
Pontuação: 100% do XP para o assignee
Uso: Trabalho individual, responsabilidade única
```

### **3. Cards COM Múltiplos Assignees (NOVO!)**
```
Comportamento: Todos os assignees compartilham a responsabilidade
Pontuação: XP dividido igualmente entre TODOS os assignees
Uso: Trabalho em equipe, colaboração
```

---

## 💰 Sistema de Pontuação Colaborativa

### **Fórmula Base**
```typescript
// Pontos por tarefa individual
taskXP = 1 XP

// Bônus de card completo
cardCompletionBonus = totalTasks * 0.1 (10% do total)

// Bônus de urgência
urgencyMultiplier = {
  LOW: 1.0,
  MEDIUM: 1.2,
  HIGH: 1.5,
  CRITICAL: 2.0
}

// Bônus de pontualidade (se completar antes do prazo)
onTimeBonus = 20% extra
```

### **Distribuição em Equipe**

#### **Opção A: Divisão Igualitária (RECOMENDADA)**
```
Card com 3 assignees completado = 100 XP total
Cada assignee recebe: 100 / 3 = 33.3 XP

Vantagens:
✅ Simples e justo
✅ Incentiva colaboração
✅ Evita "roubo" de pontos
```

#### **Opção B: Proporcional à Contribuição**
```
Card com 10 tarefas e 2 assignees:
- Assignee A marca 7 tarefas = 70% dos pontos
- Assignee B marca 3 tarefas = 30% dos pontos

Vantagens:
✅ Recompensa quem trabalha mais
✅ Métricas detalhadas de contribuição
❌ Complexo de implementar
```

#### **Opção C: Híbrida (MAIS JUSTA)**
```
50% dividido igualmente + 50% proporcional

Exemplo com card de 100 XP e 2 pessoas:
- Base: 50 XP / 2 = 25 XP para cada
- Proporcional: 50 XP dividido por contribuição
  - A marcou 7/10 = 35 XP
  - B marcou 3/10 = 15 XP
- Total: A = 60 XP, B = 40 XP

Vantagens:
✅ Justo para todos
✅ Recompensa esforço individual
✅ Mantém espírito de equipe
```

---

## 📈 Métricas de Equipe

### **Stats Individuais (já existem)**
```typescript
interface UserStats {
  xp: number;
  level: number;
  coins: number;
  tasksCompleted: number;
  tasksCompletedOnTime: number;
  cardsCompleted: number;
  currentStreak: number;
}
```

### **Stats de Colaboração (NOVO!)**
```typescript
interface CollaborationStats {
  // Trabalho em equipe
  teamTasksCompleted: number;        // Tarefas em cards com múltiplos assignees
  teamCardsCompleted: number;        // Cards completos em equipe
  collaborationScore: number;        // 0-100, baseado em % de trabalho colaborativo

  // Performance em equipe
  averageTeamSize: number;           // Média de pessoas nos cards que participou
  teamCompletionRate: number;        // % de cards em equipe completados no prazo

  // Contribuição individual em equipe
  teamContributionRate: number;      // % de tarefas que marcou em cards compartilhados
  helpedTeammatesCount: number;      // Quantos colegas já ajudou em cards
}
```

### **Achievements de Equipe (NOVO!)**
```typescript
const TEAM_ACHIEVEMENTS = [
  {
    key: "team_player",
    name: "Team Player",
    description: "Complete 10 cards em equipe",
    icon: "👥",
    tier: "bronze",
    requirement: { teamCardsCompleted: 10 },
    xpReward: 50,
    coinsReward: 20,
  },
  {
    key: "collaboration_master",
    name: "Mestre da Colaboração",
    description: "Trabalhe com 5 pessoas diferentes",
    icon: "🤝",
    tier: "silver",
    requirement: { helpedTeammatesCount: 5 },
    xpReward: 100,
    coinsReward: 50,
  },
  {
    key: "team_leader",
    name: "Líder de Equipe",
    description: "Complete 50 cards em equipe",
    icon: "👑",
    tier: "gold",
    requirement: { teamCardsCompleted: 50 },
    xpReward: 250,
    coinsReward: 100,
  },
  {
    key: "synergy",
    name: "Sinergia Perfeita",
    description: "Complete 10 cards em equipe com 100% de pontualidade",
    icon: "⚡",
    tier: "platinum",
    requirement: { teamCardsCompleted: 10, teamCompletionRate: 100 },
    xpReward: 500,
    coinsReward: 200,
  },
];
```

---

## 🎨 Interface de Avaliação de Equipe

### **1. Dashboard de Performance Individual**
```
┌─────────────────────────────────────────┐
│ 📊 Minha Performance                    │
├─────────────────────────────────────────┤
│ Individual:                             │
│ • Cards completados: 25                 │
│ • Taxa de pontualidade: 85%             │
│                                         │
│ Em Equipe:                              │
│ • Cards compartilhados: 15              │
│ • Colaboração score: 78/100             │
│ • Trabalhou com: 6 pessoas              │
│                                         │
│ Contribuição:                           │
│ • Tarefas marcadas: 120                 │
│ • Em cards de equipe: 45 (37%)         │
└─────────────────────────────────────────┘
```

### **2. Leaderboard com Filtros**
```
┌─────────────────────────────────────────┐
│ 🏆 Ranking                              │
│ [Individual] [Equipe] [Colaboração]     │
├─────────────────────────────────────────┤
│ 1. João    - 2500 XP - ⭐⭐⭐⭐⭐         │
│ 2. Maria   - 2300 XP - ⭐⭐⭐⭐           │
│ 3. Pedro   - 2100 XP - ⭐⭐⭐⭐           │
└─────────────────────────────────────────┘

Filtros:
• Individual: XP total, level
• Equipe: teamCardsCompleted
• Colaboração: collaborationScore
```

### **3. Card com Múltiplos Assignees - Visual**
```
┌─────────────────────────────────────────┐
│ 📝 Implementar Feature X                │
├─────────────────────────────────────────┤
│ 👥 Assignees:                           │
│ • João (você) - 7/10 tarefas ████░░     │
│ • Maria       - 3/10 tarefas ██░░░░     │
│                                         │
│ ✅ Checklist de Design (João)           │
│ ✅ Checklist de Backend (Maria)         │
│ ⬜ Checklist de Testes (não iniciado)   │
│                                         │
│ 🎯 XP estimado: 100 (50 cada)           │
└─────────────────────────────────────────┘
```

### **4. Resumo de Card Completado (Equipe)**
```
┌─────────────────────────────────────────┐
│ 🎉 Card Completado!                     │
├─────────────────────────────────────────┤
│ Feature X foi finalizada!               │
│                                         │
│ Distribuição de XP:                     │
│ • João:  60 XP (70% contrib.) ⭐        │
│ • Maria: 40 XP (30% contrib.)           │
│                                         │
│ Bônus de equipe: +20 XP cada            │
│ Finalizado no prazo: +15 XP cada        │
│                                         │
│ 🏆 Achievement desbloqueado!            │
│ "Team Player" (+50 XP, +20 moedas)      │
└─────────────────────────────────────────┘
```

---

## 🔧 Implementação Técnica

### **Estrutura de Dados**

#### **1. Tracking de Contribuições**
```typescript
interface TaskContribution {
  cardId: string;
  userId: string;
  tasksMarked: number;      // Quantas tarefas marcou
  totalTasks: number;       // Total de tarefas do card
  contributionPercent: number;  // tasksMarked / totalTasks
  xpEarned: number;
  completedAt: DateTime;
}
```

#### **2. Modelo Prisma (NOVO)**
```prisma
model TaskContribution {
  id                  String   @id @default(cuid())
  cardId              String
  userId              String
  tasksMarked         Int      @default(0)
  totalTasks          Int
  contributionPercent Float    @default(0)
  xpEarned            Int      @default(0)
  createdAt           DateTime @default(now())

  card                Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([cardId, userId])
  @@index([userId])
  @@index([cardId])
}

model CollaborationStats {
  id                    String   @id @default(cuid())
  userId                String   @unique
  teamTasksCompleted    Int      @default(0)
  teamCardsCompleted    Int      @default(0)
  collaborationScore    Int      @default(0)
  averageTeamSize       Float    @default(0)
  teamCompletionRate    Float    @default(0)
  teamContributionRate  Float    @default(0)
  helpedTeammatesCount  Int      @default(0)

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### **3. Lógica de Award XP Atualizada**

```typescript
async function awardXpForChecklistItem(
  userId: string,
  card: CardWithChecklists,
  isCardComplete: boolean
): Promise<GamificationResult> {

  // 1. Verificar assignees
  const assignees = await prisma.cardAssignee.findMany({
    where: { cardId: card.id },
  });

  // 2. Card sem assignees = comportamento antigo
  if (assignees.length === 0) {
    return awardXpToSingleUser(userId, card, isCardComplete);
  }

  // 3. Card com assignees = verificar elegibilidade
  const isAssignee = assignees.some(a => a.userId === userId);
  if (!isAssignee) {
    console.log(`User ${userId} não está atribuído ao card`);
    return emptyGamificationResult();
  }

  // 4. Registrar contribuição
  await trackTaskContribution(card.id, userId);

  // 5. Se card completou, calcular e distribuir XP
  if (isCardComplete) {
    return distributeXpToAssignees(card, assignees);
  }

  // 6. Card ainda em progresso - dar XP parcial
  return awardPartialXp(userId, card);
}

async function distributeXpToAssignees(
  card: CardWithChecklists,
  assignees: CardAssignee[]
): Promise<void> {

  // Calcular XP total do card
  const totalXp = calculateCardTotalXp(card);

  // Buscar contribuições
  const contributions = await prisma.taskContribution.findMany({
    where: { cardId: card.id },
  });

  // Opção A: Divisão igual
  const xpPerPerson = totalXp / assignees.length;

  // Opção B: Proporcional
  // const contributions = {...}

  // Opção C: Híbrida (50% igual + 50% proporcional)
  const baseXp = totalXp * 0.5 / assignees.length;
  const meritXp = totalXp * 0.5;

  for (const assignee of assignees) {
    const contribution = contributions.find(c => c.userId === assignee.userId);
    const contributionPercent = contribution?.contributionPercent || 0;
    const meritShare = meritXp * contributionPercent;
    const finalXp = baseXp + meritShare;

    await awardXpToUser(assignee.userId, finalXp, card);
  }
}
```

---

## 📋 Checklist de Implementação

### **Fase 1: Base (Já existe)**
- [x] Sistema de atribuição (CardAssignee)
- [x] Award XP básico
- [x] UserStats

### **Fase 2: Tracking de Contribuições**
- [ ] Criar modelo TaskContribution
- [ ] Criar modelo CollaborationStats
- [ ] Registrar quem marca cada tarefa
- [ ] Calcular % de contribuição

### **Fase 3: Distribuição de XP**
- [ ] Implementar divisão de XP entre assignees
- [ ] Adicionar bônus de equipe
- [ ] Atualizar CollaborationStats

### **Fase 4: Achievements de Equipe**
- [ ] Definir achievements colaborativos
- [ ] Sistema de detecção automática
- [ ] Notificações de conquista

### **Fase 5: Interface**
- [ ] Dashboard de colaboração
- [ ] Visual de contribuições no card
- [ ] Leaderboard de equipe
- [ ] Resumo ao completar card

---

## 🎯 Recomendação Final

**Para NexList, recomendo:**

1. **Distribuição de XP:** Opção C (Híbrida)
   - 50% dividido igualmente (espírito de equipe)
   - 50% proporcional (meritocracia)

2. **Tracking:** Registrar cada tarefa marcada
   - Simples: quem marcou + timestamp
   - Permite análises futuras

3. **Bônus de Equipe:** +10% XP extra para cards colaborativos
   - Incentiva trabalho em grupo
   - Recompensa quem ajuda outros

4. **Achievements:** Focar em colaboração
   - "Team Player" (primeiros cards em equipe)
   - "Collaboration Master" (trabalhar com várias pessoas)
   - "Synergy" (alta performance em equipe)

---

## 💡 Exemplos Práticos

### **Cenário 1: Card Individual**
```
Card: "Criar relatório"
Assignee: João
Tarefas: 5
João marca todas: 5 XP base + bônus

✅ João ganha 100% dos pontos
```

### **Cenário 2: Card em Dupla (Divisão Igual)**
```
Card: "Desenvolver feature"
Assignees: João e Maria
Tarefas: 10
Total XP: 100

Distribuição (50/50):
João: 50 XP
Maria: 50 XP

✅ Justo e simples
```

### **Cenário 3: Card em Dupla (Híbrido)**
```
Card: "Desenvolver feature"
Assignees: João (7 tarefas) e Maria (3 tarefas)
Total XP: 100

Distribuição (50% base + 50% mérito):
- Base: 50 / 2 = 25 XP cada
- Mérito:
  - João: 50 * 0.7 = 35 XP
  - Maria: 50 * 0.3 = 15 XP

Total:
João: 25 + 35 = 60 XP ⭐
Maria: 25 + 15 = 40 XP

✅ Recompensa esforço mas mantém colaboração
```

---

## 🚀 Próximos Passos

1. **Definir qual opção usar** (A, B ou C)
2. **Criar migrations** para novos modelos
3. **Implementar tracking** de contribuições
4. **Atualizar award-xp.ts** com nova lógica
5. **Criar UI** para mostrar stats de equipe
6. **Testar** com cenários reais

**Qual opção prefere? A, B ou C?** 🎯
