# NexList - Next.js 14 Trello-style Board System

Production-ready starter for building internal Trello-style boards with modern security and architecture.

## 🚀 Features

- **Next.js 14** with App Router + TypeScript
- **Prisma ORM** with PostgreSQL
- **Lucia Auth** - Secure HttpOnly cookies sessions
- **CSRF Protection** - Double-submit token pattern
- **Argon2id** - Password hashing
- **Zod** - Schema validation
- **RBAC** - Board-level permissions (OWNER/ADMIN/MEMBER)
- **Tailwind CSS** + **shadcn/ui** components
- **Framer Motion** - Smooth animations

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm/npm/yarn

## 🔧 Setup

### 1. Install Dependencies

```bash
cd apps/web
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in the required variables:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Random 32+ character string
- `CSRF_SECRET` - Random 32+ character string

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
apps/web/
├── app/
│   ├── (auth)/              # Public auth pages
│   │   ├── login/
│   │   └── register/
│   ├── (protected)/         # Protected routes
│   │   ├── dashboard/
│   │   ├── inbox/
│   │   └── board/[boardId]/
│   └── api/                 # API routes
│       ├── auth/
│       ├── boards/
│       ├── invites/
│       └── notifications/
├── components/
│   ├── ui/                  # shadcn components
│   ├── auth/
│   ├── boards/
│   └── shared/
├── lib/
│   ├── auth.ts             # Lucia configuration
│   ├── csrf.ts             # CSRF protection
│   ├── db.ts               # Prisma client
│   ├── rbac.ts             # Role-based access control
│   ├── validators.ts       # Zod schemas
│   └── utils.ts
└── middleware.ts           # Route protection
```

## 🔐 Security Features

### HttpOnly Cookies
- Session tokens stored in HttpOnly cookies
- Secure flag in production
- SameSite=strict
- 30-day expiration

### CSRF Protection
- Double-submit cookie pattern
- Validated on all state-changing operations
- 1-hour token expiration

### Password Security
- Argon2id hashing algorithm
- Configurable memory/time cost
- Secure defaults (19456 memory, 2 iterations)

### RBAC
Three roles per board:
- **OWNER** - Full control (transfer ownership, delete board)
- **ADMIN** - Manage members, send invites
- **MEMBER** - View and edit cards

## 📊 Database Schema

Key models:
- **User** - Authentication and profile
- **Session** - Lucia auth sessions
- **Board** - Main workspace (supports org-wide boards)
- **BoardMember** - User-board relationship with roles
- **Column** - Board columns (ordered)
- **Card** - Tasks/items with urgency, due dates, checklists
- **Checklist** - Card sub-tasks
- **Invite** - Board invitations with expiration
- **Notification** - In-app alerts and invites

## 🎨 UI Components

Built with shadcn/ui:
- Button
- Input
- Card
- (More to add: Dialog, Dropdown, Badge, etc.)

## 🔄 API Routes

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Boards
- `GET /api/boards` - List user boards
- `POST /api/boards` - Create board
- `GET /api/boards/[id]` - Get board details
- `PUT /api/boards/[id]` - Update board
- `DELETE /api/boards/[id]` - Delete board

### Invites
- `POST /api/invites/send` - Send invite (OWNER/ADMIN only)
- `POST /api/invites/accept` - Accept invite

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications` - Mark as read

## 🚦 Next Steps

### Immediate Tasks
1. Add board detail page with columns/cards
2. Implement drag-and-drop with `@hello-pangea/dnd`
3. Create card modal with full details
4. Add checklist management
5. Implement real-time updates (Pusher/Socket.io)

### Future Enhancements
- [ ] Card comments
- [ ] File attachments
- [ ] Activity timeline
- [ ] Board templates
- [ ] Labels/tags
- [ ] Search functionality
- [ ] Email notifications
- [ ] Keyboard shortcuts
- [ ] Mobile app
- [ ] Analytics dashboard

## 🧪 Testing

```bash
# Unit tests (to be added)
npm run test

# E2E tests with Playwright (to be added)
npm run test:e2e
```

## 📦 Deployment

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables via dashboard
```

## 🛠️ Development Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format with Prettier
npm run format

# Prisma Studio (database GUI)
npx prisma studio

# Reset database
npx prisma migrate reset
```

## 📚 Tech Stack Documentation

- [Next.js 14](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Lucia Auth](https://lucia-auth.com)
- [Zod](https://zod.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion)

## 🤝 Contributing

This is a starter template. Fork and customize for your needs!

## 📄 License

MIT