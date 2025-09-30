# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NexList** is a production-ready internal Trello-style board system for Nexma team collaboration. Built with Next.js 14, it provides secure group-based board management with comprehensive task tracking, real-time notifications, performance metrics, and automatic workflow management.

## Recent Major Implementations (2025-09)

### ✅ Completed Features

#### 1. CSRF Protection & Rate Limiting
- Re-enabled CSRF protection with double-submit token pattern
- Upstash Redis rate limiting (5 requests/15min for auth endpoints)
- Protected all authentication routes

#### 2. User Interface Enhancements
- **Navbar** with user menu, profile dropdown, and logout
- **Toast notifications** using Sonner library
- **Error boundaries** at route, global, and component levels
- **Performance tracking component** (CardPerformance.tsx)

#### 3. Real-time Features
- **Pusher integration** for live board updates
- Server-side triggers for card operations
- Custom hooks: useBoards, useInbox, useRealtime, use-toast-actions

#### 4. Card Assignment System
- **AssigneeSelector** component with autocomplete
- Email/name search with dropdown suggestions
- Visual assignee list with avatars
- Notifications when users are assigned to cards
- Only board members can be assigned

#### 5. Performance Dashboard
- **`/performance` page** showing user metrics:
  - Total cards assigned
  - Task completion rate
  - Cards completed vs incomplete
  - Cards overdue
  - Detailed card list with progress bars
- Accessible via navbar menu

#### 6. "Trello Geral Nexma" - Company-Wide Board
- **All users are automatically members**
- New users added on registration
- **Notifications for all members** when:
  - New card is created
  - New column is created
  - Checklist item is completed
- Script: `npm run add:general` to add existing users

#### 7. Automatic Workflow Management
- **"✅ Finalizado" column** created automatically in all boards
- When ALL checklist items are marked done:
  - Card automatically moves to "Finalizado"
  - All members receive celebration notification 🎉
- Modal reload after completion shows updated board state

#### 8. Permission System (RBAC)
- **Only OWNER can delete** cards and boards
- ADMIN/MEMBER can create and edit
- Board owner always has full access
- Org-wide boards (isOrgWide: true) allow all users

#### 9. User Database Seeding
- Test users: Daniel, Carlos, Cauê, Whanderson, Steve, Patrik
- All emails: `[name]@nexma.com`
- Password: `senha123`
- Scripts:
  - `npm run seed:users-only` - Create users without board membership
  - `npm run clean:members` - Remove all members except owners
  - `npm run add:finished` - Add Finalizado column to all boards

#### 10. Visual Checklist Previews
- Cards show checklist items directly on board
- Displays up to 2 checklists with 3 items each
- Green checkbox ✓ for completed items
- Strikethrough text for done items
- "+X more..." indicators for additional items

## Project Vision & Requirements

### Core Concept
NexList is an internal Trello for Nexma where:
- Users create private **groups (boards)** that belong to their account
- Group owners invite members via email (invitation system with inbox notifications)
- Each group has columns and cards with full task tracking
- A special **"Trello Geral Nexma"** board is accessible to everyone for company-wide events/announcements
- Automatic workflow: cards move to "Finalizado" when all tasks complete
- Performance tracking per user

### Key Workflows

#### 1. User Registration & Login
- Secure registration with email/password (Argon2id hashing)
- HttpOnly cookie-based sessions (30-day expiration)
- Protected routes with middleware
- **Auto-added to "Trello Geral Nexma"** on registration

#### 2. Group Creation & Invitations
- User creates a private group with a title
- **Board automatically includes "✅ Finalizado" column**
- Owner invites others by selecting from user list (not email input)
- System shows all active users with membership status
- Invited user sees invitation in their **inbox** (notifications page)
- Upon acceptance, user gains MEMBER role and access to all group cards

#### 3. Card Management
- Each card has:
  - **Title** (required)
  - **Urgency** (LOW/MEDIUM/HIGH/CRITICAL)
  - **Created date** (automatic)
  - **Due date** (optional, for performance tracking)
  - **Completed date** (set when all checklists done)
  - **Description** (optional)
  - **Checklists** - Multiple checklists per card with checkable items
  - **Assignees** - Multiple users can be assigned
  - **Performance calculation** - Based on checklist completion % and due date adherence
  - **Visual preview** - Checklist items shown on card in board view

#### 4. Notifications & Alerts
- **Inbox page** shows:
  - Pending invitations (accept/decline)
  - Alerts from group activity
  - Card assignments
  - Checklist completions
  - Card moved to Finalizado
- **Navbar badge** shows unread count
- Notifications are created for:
  - New group invitations
  - Card assignments (with card title)
  - Checklist item completions (all members notified)
  - Card completion (moved to Finalizado)
  - New cards/columns in "Trello Geral"

#### 5. Automatic Card Completion
When a user marks the last pending checklist item as done:
1. **Backend checks** if ALL items are complete
2. **Finds "Finalizado" column** (case-insensitive search)
3. **Moves card** to Finalizado automatically
4. **Notifies all board members** with celebration message
5. **Modal reloads** when closed to show updated board state

#### 6. Performance Tracking
Users can view their performance at `/performance`:
- Cards assigned to them
- Completion rate percentage
- Number of cards completed
- Number of cards overdue
- Visual progress bars per card
- Accessible via navbar "📊 Minha Performance"

### Permission Model (RBAC)

Located in `apps/web/lib/rbac.ts`:

- **OWNER**
  - Creator of board
  - Can delete cards and boards
  - Can manage all settings
  - Can invite members

- **ADMIN**
  - Can invite users
  - Can manage cards and columns
  - Cannot delete boards or cards

- **MEMBER**
  - Can view and edit cards
  - Can create checklists
  - Can add comments
  - Cannot delete anything

Special cases:
- **Board owner** always has OWNER permissions
- **Org-wide boards** (isOrgWide: true) grant MEMBER access to all users
- **Deletion** (`DELETE /api/boards/[boardId]/cards/[cardId]`) requires OWNER role

### Technology Stack Requirements

- **Next.js 14** App Router + TypeScript
- **Tailwind CSS** + shadcn/ui for UI components
- **Framer Motion** for animations (modals, transitions)
- **Prisma** + PostgreSQL for database
- **Lucia Auth v3** for secure session management
- **Zod** for input validation
- **Sonner** for toast notifications
- **Pusher** for real-time updates (optional)
- **Upstash Redis** for rate limiting
- **@hello-pangea/dnd** for drag-and-drop

## Core Architecture

### Authentication & Security
- **Lucia Auth v3** with Prisma adapter for session management
- Sessions stored in **HttpOnly cookies** (30-day expiration)
- **Argon2id** password hashing with configurable parameters
- **CSRF protection** via double-submit token pattern (`/api/csrf`)
- **Rate limiting** via Upstash Redis (auth endpoints: 5 req/15min)
- Middleware-based route protection (`apps/web/middleware.ts`)

### Database Layer
- **Prisma ORM** with PostgreSQL
- Schema location: `apps/web/prisma/schema.prisma`
- Connection: Uses local PostgreSQL on port 5432, database `TrelloNexma`
- All models use `onDelete: Cascade` for referential integrity

### Key Domain Models

```prisma
model Board {
  isOrgWide Boolean @default(false)  // "Trello Geral" uses true
  ownerId   String
  members   BoardMember[]
  columns   Column[]
  cards     Card[]
}

model BoardMember {
  role   Role  // OWNER | ADMIN | MEMBER
}

model Column {
  order  Int   // For sorting (not "position")
}

model Card {
  urgency       Urgency  // LOW | MEDIUM | HIGH | CRITICAL
  dueAt         DateTime?
  completedAt   DateTime?
  checklists    Checklist[]
  assignees     CardAssignee[]
}

model ChecklistItem {
  done    Boolean @default(false)
  doneAt  DateTime?
}

model Notification {
  type    NotificationType  // INVITE | ALERT
  isRead  Boolean @default(false)
}
```

### RBAC Implementation

Located in `apps/web/lib/rbac.ts`:

```typescript
export async function assertBoardRole(
  boardId: string,
  userId: string,
  allowedRoles: Role[] = ["MEMBER", "ADMIN", "OWNER"]
) {
  // Check if user is board owner
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true, isOrgWide: true },
  });

  // Owner always has access
  if (board.ownerId === userId) {
    return { role: "OWNER" as Role, boardId, userId };
  }

  // Org-wide boards allow MEMBER access to all users
  if (board.isOrgWide) {
    return { role: "MEMBER" as Role, boardId, userId };
  }

  // Check BoardMember record
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });

  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error("Acesso negado");
  }

  return member;
}
```

## Development Commands

### Initial Setup
```bash
cd apps/web
npm install
cp ../../.env.example .env  # Edit with your PostgreSQL credentials
npx prisma generate
npx prisma migrate dev --name init
npm run dev  # Runs on http://localhost:3000
```

### Database Operations
```bash
# View database in GUI
npx prisma studio

# Create new migration after schema changes
npx prisma migrate dev --name descriptive_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Regenerate Prisma Client after schema changes
npx prisma generate
```

### Utility Scripts
```bash
# User Management
npm run seed:users-only      # Create test users without board membership
npm run clean:members        # Remove all board members except owners

# Board Setup
npm run add:general          # Add all users to "Trello Geral Nexma"
npm run add:finished         # Add "✅ Finalizado" column to all boards

# Testing
npm run test:system          # Run comprehensive system tests
```

### Common Development Tasks
```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Project Structure

```
apps/web/
├── app/
│   ├── (auth)/                    # Public routes: login, register
│   ├── (protected)/               # Auth-required routes
│   │   ├── dashboard/            # Main board list
│   │   ├── performance/          # User performance metrics
│   │   ├── inbox/                # Notifications and invites
│   │   ├── board/[boardId]/      # Board detail view
│   │   └── layout.tsx            # Navbar wrapper
│   ├── api/
│   │   ├── auth/                 # register, login, logout
│   │   ├── boards/               # Board CRUD + nested routes
│   │   │   └── [boardId]/
│   │   │       ├── cards/        # Card CRUD
│   │   │       │   └── [cardId]/
│   │   │       │       ├── assignees/     # POST, DELETE /:userId
│   │   │       │       └── route.ts       # GET, PUT, DELETE
│   │   │       └── columns/      # Column CRUD
│   │   ├── invites/              # send, accept
│   │   ├── notifications/        # GET, PUT (mark read)
│   │   ├── users/available/      # GET users for invite/assign
│   │   └── checklist-items/[itemId]/  # toggle, delete
│   ├── layout.tsx                # Root layout + Toaster
│   ├── error.tsx                 # Route error boundary
│   ├── global-error.tsx          # Global error boundary
│   └── globals.css               # Tailwind directives
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── auth/
│   │   └── AuthCard.tsx          # Login/register forms
│   ├── boards/
│   │   ├── BoardClient.tsx       # Main board rendering
│   │   ├── DraggableBoard.tsx    # Drag & drop implementation
│   │   ├── CreateBoardDialog.tsx
│   │   ├── CreateColumnDialog.tsx
│   │   ├── CreateCardDialog.tsx
│   │   ├── CardModal.tsx         # Full card details
│   │   ├── CardPerformance.tsx   # Progress visualization
│   │   ├── AssigneeSelector.tsx  # User assignment with autocomplete
│   │   └── InviteMemberDialog.tsx # User selection for invites
│   └── shared/
│       └── Navbar.tsx            # Top navigation bar
├── lib/
│   ├── auth.ts                   # Lucia config + helpers
│   ├── csrf.ts                   # CSRF token generation
│   ├── rate-limit.ts             # Upstash Redis rate limiting
│   ├── db.ts                     # Prisma client singleton
│   ├── rbac.ts                   # Role-based access control
│   ├── validators.ts             # Zod schemas
│   ├── pusher.ts                 # Real-time triggers
│   ├── utils.ts                  # Utility functions
│   └── hooks/                    # Custom React hooks
│       ├── use-boards.ts
│       ├── use-inbox.ts
│       ├── use-realtime.ts
│       └── use-toast-actions.ts
├── middleware.ts                 # Route protection
└── prisma/
    └── schema.prisma             # Database schema

scripts/
├── seed-users-only.ts            # Create test users
├── seed-users.ts                 # Create users + add to boards
├── clean-board-members.ts        # Remove non-owner members
├── add-all-to-general-board.ts   # Add users to Trello Geral
├── add-finished-column.ts        # Add Finalizado column
└── test-system.ts                # System validation tests
```

## API Route Patterns

### Authentication Flow
1. User submits form → Client calls `/api/auth/register` or `/api/auth/login`
2. Server validates with Zod, hashes password with Argon2id
3. **Rate limiting check** (5 requests per 15 minutes per IP)
4. Creates Lucia session, sets HttpOnly cookie
5. **For registration**: Auto-adds user to "Trello Geral Nexma"
6. Returns JSON response

### Board Access Control
All board-related API routes:
```typescript
const { user } = await getSession();
if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

// For write operations, check role
await assertBoardRole(boardId, user.id, ["OWNER", "ADMIN"]);

// For delete operations, require OWNER
await assertBoardRole(boardId, user.id, ["OWNER"]);
```

### Card Assignment
```typescript
// POST /api/boards/[boardId]/cards/[cardId]/assignees
// 1. Validate user exists and is board member
// 2. Create CardAssignee record
// 3. Create notification for assigned user
// 4. Return success

// DELETE /api/boards/[boardId]/cards/[cardId]/assignees/[userId]
// Remove assignment and update UI
```

### Checklist Completion Logic
```typescript
// PUT /api/checklist-items/[itemId]
// When marking item as done:
// 1. Update item.done = true, item.doneAt = now
// 2. Notify all board members (except current user)
// 3. Check if ALL items in card are done
// 4. If yes:
//    a. Find "Finalizado" column (case-insensitive)
//    b. Move card to Finalizado
//    c. Send celebration notification to all members
```

### Nested Resource Routes
- `POST /api/boards/[boardId]/cards` - Create card + notify all members if org-wide
- `GET /api/boards/[boardId]/cards/[cardId]` - Get card with checklists & assignees
- `PUT /api/boards/[boardId]/cards/[cardId]` - Update card (any field)
- `DELETE /api/boards/[boardId]/cards/[cardId]` - Delete card (OWNER only)
- `POST /api/boards/[boardId]/columns` - Create column + notify all members if org-wide
- `POST /api/boards/[boardId]/cards/[cardId]/assignees` - Assign user + notify
- `DELETE /api/boards/[boardId]/cards/[cardId]/assignees/[userId]` - Unassign
- `PUT /api/checklist-items/[itemId]` - Toggle + auto-complete card if all done

## Client-Server Boundary

### Server Components (default in App Router)
- Board pages (`board/[boardId]/page.tsx`) - Fetch with Prisma
- Dashboard (`dashboard/page.tsx`) - Fetch boards
- Performance page (`performance/page.tsx`) - Fetch user metrics
- Protected layout - Fetch unread notification count

### Client Components ("use client")
- All dialog/modal components
- `DraggableBoard.tsx` - Drag & drop, card click, modal management
- `CardModal.tsx` - Form state, checklist toggles
- `AssigneeSelector.tsx` - Autocomplete, user selection
- `Navbar.tsx` - Dropdown menu state
- `AuthCard.tsx` - Form state, CSRF token

### Data Flow
1. Server Component fetches data with Prisma
2. Passes serialized data to Client Component
3. Client Component handles interactions, calls API routes
4. **Modal reloads page** on close (`window.location.reload()`)
5. Notifications update via real-time or polling

## Important Implementation Notes

### Automatic Card Completion
When the last checklist item is marked done:
```typescript
// 1. Check if all items are complete
const allItems = card.checklists.flatMap(c => c.items);
const allCompleted = allItems.every(item => item.done);

// 2. Find Finalizado column
const finishedColumn = await prisma.column.findFirst({
  where: {
    boardId,
    title: { contains: "Finalizado", mode: "insensitive" }
  }
});

// 3. Move card
await prisma.card.update({
  where: { id: cardId },
  data: { columnId: finishedColumn.id }
});

// 4. Notify all members
await prisma.notification.createMany({
  data: members.map(m => ({
    userId: m.userId,
    type: "ALERT",
    title: "Card finalizado! 🎉",
    message: `Card "${card.title}" foi movido para Finalizado`
  }))
});
```

### Session Management
- `getSession()` from `lib/auth.ts` returns `{ user, session }` or `{ user: null, session: null }`
- `requireAuth()` throws if no session (use in Server Components)
- Middleware redirects unauthenticated users to `/login?next=<path>`

### Rate Limiting
Implemented via Upstash Redis:
```typescript
// lib/rate-limit.ts
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "nexlist:auth",
});

// Usage in auth routes
const ip = getClientIp(req);
const { success, reset } = await checkRateLimit(authRateLimit, ip);
if (!success) {
  return NextResponse.json(
    { error: "Muitas tentativas", resetAt: reset },
    { status: 429 }
  );
}
```

### Assignee Autocomplete UX
1. User types in input field
2. Dropdown shows matching users (name or email)
3. Click user → email fills input
4. "Atribuir" button enables
5. Click → assigns user + notifies + shows in "Pessoas Atribuídas"

### Checklist Preview on Cards
Cards display checklist items directly:
- Shows up to 2 checklists
- Each checklist shows up to 3 items
- Green checkbox ✓ for done items
- Strikethrough for completed text
- "+X more..." indicators

## Test Users

Created via `npm run seed:users-only`:

| Name | Email | Password |
|------|-------|----------|
| Alice Silva | alice@nexma.com | senha123 |
| Bob Santos | bob@nexma.com | senha123 |
| Carol Oliveira | carol@nexma.com | senha123 |
| David Costa | david@nexma.com | senha123 |
| Eva Ferreira | eva@nexma.com | senha123 |
| Daniel | daniel@nexma.com | senha123 |
| Carlos | carlos@nexma.com | senha123 |
| Cauê | caue@nexma.com | senha123 |
| Whanderson | whanderson@nexma.com | senha123 |
| Steve | steve@nexma.com | senha123 |
| Patrik | patrik@nexma.com | senha123 |

## Environment Variables

Required in `apps/web/.env`:
```bash
DATABASE_URL="postgresql://steveherison@localhost:5432/TrelloNexma?schema=public"
AUTH_SECRET="<64-char-hex-string>"
CSRF_SECRET="<64-char-hex-string>"
NODE_ENV="development"

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

Optional (for real-time):
```bash
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER="sa1"
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="sa1"
```

## Tech Stack Versions

- **Next.js**: 14.2.9 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.6.2
- **Prisma**: 5.19.1
- **Lucia**: 3.2.0 with adapter-prisma 4.0.1
- **Tailwind**: 3.4.10
- **Zod**: 3.23.8
- **Sonner**: 2.0.7 (toast notifications)
- **@hello-pangea/dnd**: 16.6.0 (drag & drop)
- **Upstash Redis**: 1.35.4 (rate limiting)
- **Upstash Ratelimit**: 2.0.6

## Known Issues & Future Improvements

### 1. Date Validation
Cards use HTML `datetime-local` input which doesn't include timezone. Current handling:
```typescript
dueAt: data.dueAt && data.dueAt.trim() ? new Date(data.dueAt) : null
```
Removed `.datetime()` from Zod validation to allow this format.

### 2. Real-time Updates
Pusher is integrated but can be optimized:
- Modal uses `window.location.reload()` after close
- Consider using `router.refresh()` or React Query for better UX

### 3. Params Promise Handling
Next.js 14/15 may return params as Promise:
```typescript
const resolvedParams = await Promise.resolve(params);
const { boardId, cardId } = resolvedParams;
```

### 4. Performance Optimization
- Consider adding loading states instead of full page reloads
- Implement optimistic updates for checklist toggles
- Add pagination for large card lists

### 5. Mobile Responsiveness
- Drag & drop works but could be improved for touch devices
- Modal sizing on small screens needs testing

## Troubleshooting

### "Prisma schema not found"
```bash
cd apps/web  # Schema is in apps/web/prisma/
npx prisma generate
```

### Sessions not persisting
Check:
1. Cookie is set (DevTools → Application → Cookies)
2. `auth_session` cookie has `HttpOnly`, `SameSite=Strict`
3. Middleware allows path (check `matcher` config)

### Rate limit errors
If testing auth repeatedly:
```bash
# Clear Redis cache
redis-cli FLUSHDB
```

### Card not moving to Finalizado
Check:
1. Board has "Finalizado" column (case-insensitive search)
2. Run `npm run add:finished` to add to existing boards
3. Check console for errors in checklist-items PUT route

### Database connection errors
```bash
psql -U steveherison -d TrelloNexma -c "SELECT 1;"
```

If connection refused, start PostgreSQL or update `DATABASE_URL`.

### Assignees not showing after attribution
1. Check browser console for API errors
2. Modal should reload on close
3. Verify user is board member: `npm run test:system`