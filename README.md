# Cocorico v2 - Restaurant Stock Management System

A production-ready, modular Next.js 15 full-stack application for restaurant inventory management, built with best practices and scalability in mind.

## 🎯 Architecture Highlights

- **Next.js 15** with App Router (Route Groups, Server Components, Server Actions)
- **TypeScript** with strict mode
- **Prisma** ORM with PostgreSQL
- **Modular Structure** - Max 150 lines per file
- **shadcn/ui** component library (Radix UI + Tailwind)
- **Server-First** architecture for optimal performance
- **Type-Safe** throughout (Zod validation + Prisma types)

## 📁 Project Structure

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                 # Authentication routes (separate layout)
│   ├── (dashboard)/            # Main app routes (dashboard layout)
│   └── api/                    # API routes (webhooks, uploads only)
├── components/                 # UI components
│   └── ui/                     # shadcn/ui components (button, card, input, etc.)
├── lib/                        # Core business logic
│   ├── db/                     # Database client
│   ├── services/               # Business logic (domain-driven)
│   ├── actions/                # Server Actions (mutations)
│   ├── queries/                # Data fetching (Server Components)
│   ├── validations/            # Zod schemas
│   ├── utils/                  # Pure utility functions
│   ├── constants/              # App constants
│   └── types/                  # TypeScript types
└── providers/                  # React Context providers
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# Required:
# - DATABASE_URL (PostgreSQL connection string)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - AZURE_DOC_INTELLIGENCE_ENDPOINT
# - AZURE_DOC_INTELLIGENCE_KEY
```

### 2. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init

# (Optional) Seed with sample data
npx prisma db seed
```

### 3. Run Development Server

```bash
npm run dev

# Open http://localhost:3000
```

## 📋 Next Steps (Recommended Order)

### Phase 1: Complete Core Features (Week 1)

#### Day 1: Auth & User Management
- [ ] Implement NextAuth configuration (`src/app/api/auth/[...nextauth]/route.ts`)
- [ ] Create auth middleware (`src/middleware.ts`)
- [ ] Build login/signup pages (`src/app/(auth)/login/page.tsx`)
- [ ] Add auth provider (`src/providers/AuthProvider.tsx`)

#### Day 2: Remaining Product Features
- [ ] Create product detail page (`src/app/(dashboard)/inventory/[productId]/page.tsx`)
- [ ] Add product edit functionality
- [ ] Implement search and filters
- [ ] Add CSV export

#### Day 3: Stock Movements
- [ ] Create stock movement service (`src/lib/services/stock.service.ts`)
- [ ] Build stock history view
- [ ] Add movement creation forms
- [ ] Implement event sourcing queries

#### Day 4: Bill Upload & OCR
- [ ] Azure Document Intelligence service (`src/lib/services/ocr.service.ts`)
- [ ] File upload page (`src/app/(dashboard)/upload/page.tsx`)
- [ ] Product extraction confirmation flow
- [ ] Product mapping interface

#### Day 5: Bills Management
- [ ] Bills list page (`src/app/(dashboard)/bills/page.tsx`)
- [ ] Bill detail view
- [ ] Link bills to products
- [ ] Add bill search/filters

### Phase 2: Extended Features (Week 2)

#### Day 1-2: Disputes
- [ ] Disputes service (`src/lib/services/dispute.service.ts`)
- [ ] Disputes list page
- [ ] Create dispute form
- [ ] Dispute resolution workflow

#### Day 3-4: Menu & Recipes
- [ ] Dish service (`src/lib/services/dish.service.ts`)
- [ ] Recipe editor component
- [ ] Menu management pages
- [ ] Sales tracking

#### Day 5: Polish & Testing
- [ ] Add loading states
- [ ] Implement error boundaries
- [ ] Add toast notifications
- [ ] Manual testing of all flows

### Phase 3: Production Readiness (Week 3)

- [ ] Set up PostgreSQL database (Railway/Neon/Supabase)
- [ ] Configure environment variables
- [ ] Add proper error logging (Sentry)
- [ ] Implement database backups
- [ ] Deploy to Vercel/Railway
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring (health checks)

## 📚 Development Guide

### Code Standards

**Every file must follow these rules:**

1. **Max 150 lines** - Split larger files into smaller modules
2. **Server Components by default** - Only add `'use client'` when needed
3. **Explicit return types** - All functions must have return types
4. **No `any` types** - Use `unknown` if truly needed
5. **Zod validation** - All external inputs must be validated

### File Organization Pattern

```typescript
// 1. Imports (grouped)
import { server } from 'next';
import { external } from 'library';
import { internal } from '@/lib/utils';

// 2. Types & Interfaces
type Props = { ... };

// 3. Constants (file-scoped)
const MAX_ITEMS = 10;

// 4. Main export
export default function Component() { ... }

// 5. Helper functions (private)
function helper() { ... }
```

### Adding a New Feature

1. **Create Zod schema** → `src/lib/validations/feature.schema.ts`
2. **Create service** → `src/lib/services/feature.service.ts`
3. **Create server action** → `src/lib/actions/feature.actions.ts`
4. **Create query** → `src/lib/queries/feature.queries.ts`
5. **Create page** → `src/app/(dashboard)/feature/page.tsx`
6. **Create components** → `src/app/(dashboard)/feature/_components/`

### When to Use What

**Server Component:**
- Page components (default)
- Data fetching and display
- Static content

**Client Component (`'use client'`):**
- Form inputs and interactions
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect)
- Browser APIs

**Server Action:**
- Form submissions
- Data mutations (create, update, delete)
- Revalidating cached data

**API Route:**
- Webhooks (Stripe, etc.)
- File uploads
- Third-party integrations
- NOT for simple mutations (use Server Actions instead)

## 🏗️ Key Files Reference

```
Configuration:
├── .claude/instructions.md          # Claude maintenance guide (READ THIS!)
├── .env.example                     # Environment variables template
├── prisma/schema.prisma             # Database schema
└── src/lib/db/client.ts             # Prisma client singleton

Core Business Logic:
├── src/lib/services/*.service.ts    # Business logic
├── src/lib/actions/*.actions.ts     # Server Actions (mutations)
├── src/lib/queries/*.queries.ts     # Data fetching
└── src/lib/validations/*.schema.ts  # Zod schemas

UI Components:
└── src/components/ui/*              # shadcn/ui components
```

## 🔍 Example Code Patterns

### Pattern 1: Server Component Page

```typescript
// app/(dashboard)/products/page.tsx
import { getProducts } from '@/lib/queries/product.queries';

export default async function ProductsPage() {
  const products = await getProducts(); // Direct database query
  return <ProductList products={products} />;
}
```

### Pattern 2: Client Component with Form

```typescript
// app/(dashboard)/products/_components/CreateProductForm.tsx
'use client';
import { createProductAction } from '@/lib/actions/product.actions';

export function CreateProductForm() {
  return (
    <form action={createProductAction}>
      <input name="name" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Pattern 3: Server Action

```typescript
// lib/actions/product.actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { productSchema } from '@/lib/validations/product.schema';

export async function createProductAction(formData: FormData) {
  const validated = productSchema.parse(Object.fromEntries(formData));
  const product = await createProduct(validated);
  revalidatePath('/products');
  return { success: true, product };
}
```

## 🎨 UI Component Library

Built with **shadcn/ui** - a collection of beautifully designed, accessible components built on Radix UI and Tailwind CSS.

**Installed Components:**
- `button`, `card`, `input`, `badge`, `dialog`, `label`, `textarea`, `select`

**Adding New Components:**
```bash
npx shadcn@latest add <component-name>
# Example: npx shadcn@latest add dropdown-menu
```

All components are:
- Fully typed with TypeScript
- Styled with Tailwind CSS
- Accessible by default (Radix UI primitives)
- Customizable (copy-paste, not npm)
- Responsive (mobile-first)

**Component Location:** `src/components/ui/`

Browse all available components: https://ui.shadcn.com/docs/components

## 🗄️ Database Schema

See `prisma/schema.prisma` for complete schema.

**Key Models:**
- `User` - Authentication and user management
- `Product` - Inventory items
- `StockMovement` - Event sourcing for stock changes
- `Bill` - Imported invoices/receipts
- `Dispute` - Returns and complaints
- `Dish` - Menu items with recipes
- `Menu` - Menu organization
- `Sale` - Sales tracking

## 📦 Tech Stack

- **Framework**: Next.js 15.5.5
- **Language**: TypeScript 5
- **Database**: PostgreSQL (via Prisma 6)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **Validation**: Zod 4
- **Authentication**: NextAuth v5
- **OCR**: Azure Document Intelligence
- **Icons**: Lucide React

## 🚨 Important Notes

1. **ALWAYS** read `.claude/instructions.md` before making changes
2. **NEVER** exceed 150 lines per file
3. **ALWAYS** validate inputs with Zod schemas
4. **PREFER** Server Components over Client Components
5. **USE** Server Actions for mutations (not API routes)
6. **KEEP** business logic in services (not components)
7. **TEST** the full flow before considering a feature complete

## 🐛 Troubleshooting

### Prisma Client Not Found
```bash
npx prisma generate
```

### Database Connection Issues
```bash
# Check your DATABASE_URL in .env
# Make sure PostgreSQL is running
npx prisma studio  # Opens database GUI
```

### TypeScript Errors
```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## 📖 Additional Resources

- **Next.js 15 Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Zod Docs**: https://zod.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Claude Instructions**: `.claude/instructions.md`

## 🤝 Contributing

When adding new features:
1. Follow the patterns in existing code
2. Keep files under 150 lines
3. Add proper TypeScript types
4. Validate inputs with Zod
5. Use Server Components by default
6. Add to appropriate layer (service/action/query)

## 📝 License

Private project - All rights reserved

---

**Built with ❤️ for efficient restaurant management**
