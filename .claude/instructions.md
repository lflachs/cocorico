# Cocorico Development Instructions

**READ THIS FIRST** - These instructions must be followed for ALL code changes.

## 🎨 Design System

The app uses **shadcn/ui** with a **dark sidebar** design:
- **Sidebar:** slate-800 background with blue-600 active state
- **Main content:** slate-50 background
- **Mobile:** Responsive hamburger menu
- **i18n:** English/French language switcher

---

## 🎯 Core Principles

### 1. File Size Limit: **MAX 150 LINES**
- If a file exceeds 150 lines, it MUST be split into smaller modules
- Count includes imports, types, and all code
- Exception: Generated files (Prisma schema, migrations)

### 2. Server Components First
- ALL pages are Server Components by default
- Add `'use client'` ONLY when absolutely necessary:
  - Using React hooks (useState, useEffect, useContext, useRef, etc.)
  - Adding event handlers (onClick, onChange, onSubmit, etc.)
  - Using browser APIs (localStorage, window, document, etc.)
  - Using third-party libraries that require client-side

### 3. Type Safety Everywhere
- No `any` types (use `unknown` if truly needed)
- All functions must have explicit return types
- Use Zod for runtime validation
- Prisma types as source of truth for database models

### 4. Use shadcn/ui for ALL UI Components
- DO NOT create custom UI primitives (Button, Input, Card, etc.)
- ALWAYS use shadcn/ui components from `@/components/ui/`
- If you need a component not installed, run: `npx shadcn@latest add <component>`
- Available components: https://ui.shadcn.com/docs/components

---

## 📁 Project Structure

### Directory Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route group for authentication (separate layout)
│   ├── (dashboard)/       # Route group for main app (dashboard layout)
│   └── api/               # API routes (only for webhooks, file uploads, third-party integrations)
│
├── components/            # UI components
│   └── ui/               # shadcn/ui components (from Radix UI + Tailwind)
│
├── lib/                  # Core business logic
│   ├── db/              # Database client and utilities
│   ├── services/        # Business logic (domain-driven)
│   ├── actions/         # Server Actions for mutations
│   ├── queries/         # Data fetching functions
│   ├── validations/     # Zod schemas
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Pure utility functions
│   ├── constants/       # App constants
│   └── types/           # Shared TypeScript types
│
└── providers/           # React Context providers
```

---

## 🔧 Naming Conventions

### Files & Folders
```
Components:         PascalCase.tsx       (ProductCard.tsx)
Services:           camelCase.service.ts (product.service.ts)
Actions:            camelCase.actions.ts (product.actions.ts)
Queries:            camelCase.queries.ts (product.queries.ts)
Validations:        camelCase.schema.ts  (product.schema.ts)
Utils:              camelCase.ts         (format.ts)
Types:              camelCase.types.ts   (domain.types.ts)
Route-specific:     _components/         (underscore prefix for private)
```

### Code Elements
```typescript
// Components & Types
export function ProductCard() {}
export type ProductInput = {}
export interface Product {}

// Functions
export function calculateTotal() {}
export async function createProduct() {}

// Constants
export const MAX_UPLOAD_SIZE = 5000000;
export const SUPPORTED_UNITS = ['kg', 'l', 'pc'] as const;

// Enums (use const objects instead)
export const DisputeStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;
```

---

## 📝 Code Organization Within Files

**Every file must follow this structure:**

```typescript
// 1. Imports (grouped and ordered)
import { type ReactNode } from 'react';              // React imports
import { redirect } from 'next/navigation';          // Next.js imports
import { z } from 'zod';                              // External library imports
import { Button } from '@/components/ui/button';      // Internal imports (alphabetical)
import { formatDate } from '@/lib/utils/format';     // Utility imports

// 2. Types & Interfaces (if not imported)
type Props = {
  children: ReactNode;
  className?: string;
};

interface ProductFormData {
  name: string;
  quantity: number;
}

// 3. Constants (file-scoped)
const MAX_ITEMS = 10;
const DEFAULT_CATEGORY = 'uncategorized';

// 4. Main export (component, function, etc.)
export default async function InventoryPage() {
  // Implementation
}

// OR for named exports
export async function getProducts() {
  // Implementation
}

// 5. Helper functions (private to this file)
function calculateSubtotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

---

## 🏗️ Architecture Patterns

### Server Components (Default)

```typescript
// app/(dashboard)/inventory/page.tsx
import { getProducts } from '@/lib/queries/product.queries';

export default async function InventoryPage() {
  const products = await getProducts(); // Direct database query

  return (
    <div>
      <h1>Inventory</h1>
      <ProductList products={products} />
    </div>
  );
}
```

### Client Components (When Needed)

```typescript
// app/(dashboard)/inventory/_components/ProductFilters.tsx
'use client';

import { useState } from 'react';

type Props = {
  onFilterChange: (filters: Filters) => void;
};

export function ProductFilters({ onFilterChange }: Props) {
  const [category, setCategory] = useState('all');

  return (
    <select value={category} onChange={(e) => setCategory(e.target.value)}>
      {/* Options */}
    </select>
  );
}
```

### Server Actions (Mutations)

```typescript
// lib/actions/product.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { productSchema } from '@/lib/validations/product.schema';
import { createProduct } from '@/lib/services/product.service';

export async function createProductAction(formData: FormData): Promise<ActionResult> {
  // 1. Parse and validate
  const rawData = {
    name: formData.get('name'),
    quantity: Number(formData.get('quantity')),
  };

  const validated = productSchema.parse(rawData);

  // 2. Execute business logic
  const product = await createProduct(validated);

  // 3. Revalidate and redirect
  revalidatePath('/inventory');
  redirect(`/inventory/${product.id}`);
}

type ActionResult = {
  success: boolean;
  error?: string;
  data?: any;
};
```

### Services (Business Logic)

```typescript
// lib/services/product.service.ts
import { db } from '@/lib/db/client';
import type { ProductInput } from '@/lib/validations/product.schema';

export async function createProduct(data: ProductInput) {
  return await db.product.create({
    data: {
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      trackable: true,
    },
  });
}

export async function updateProductQuantity(
  productId: string,
  quantity: number
): Promise<void> {
  await db.product.update({
    where: { id: productId },
    data: { quantity },
  });
}
```

### Queries (Data Fetching)

```typescript
// lib/queries/product.queries.ts
import { db } from '@/lib/db/client';
import { cache } from 'react';

// Use React cache for request memoization
export const getProducts = cache(async () => {
  return await db.product.findMany({
    orderBy: { name: 'asc' },
  });
});

export const getProductById = cache(async (id: string) => {
  return await db.product.findUnique({
    where: { id },
    include: {
      movements: true,
      recipeIngredients: true,
    },
  });
});
```

### Validations (Zod Schemas)

```typescript
// lib/validations/product.schema.ts
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.enum(['kg', 'l', 'pc'], {
    errorMap: () => ({ message: 'Invalid unit' }),
  }),
  category: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;
```

---

## 🎨 Component Patterns

### Using shadcn/ui Components

**All UI components come from shadcn/ui** - DO NOT create custom UI components.

```typescript
// ✅ GOOD: Use shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ProductCard() {
  return (
    <Card>
      <CardHeader>
        <h3>Product Name</h3>
      </CardHeader>
      <CardContent>
        <Button>View Details</Button>
        <Badge>In Stock</Badge>
      </CardContent>
    </Card>
  );
}
```

```typescript
// ❌ BAD: Don't create custom UI primitives
// components/MyButton.tsx
export function MyButton() { ... } // Use shadcn's Button instead!
```

### Adding New shadcn Components

When you need a new UI component:

```bash
# Add the component from shadcn/ui
npx shadcn@latest add <component-name>

# Examples:
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
npx shadcn@latest add toast
```

**Available components:** https://ui.shadcn.com/docs/components

### shadcn Component Examples

```typescript
// Button variants
<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Close</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// Card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>

// Badge
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Route-Specific Components

```typescript
// app/(dashboard)/inventory/_components/ProductList.tsx
import { type Product } from '@prisma/client';
import { ProductCard } from './ProductCard';

type Props = {
  products: Product[];
};

export function ProductList({ products }: Props) {
  if (products.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## ✅ When Adding New Features

Follow this checklist for every new feature:

### 1. Define the Schema
```typescript
// lib/validations/dispute.schema.ts
export const disputeSchema = z.object({
  billId: z.string().uuid(),
  type: z.enum(['return', 'complaint', 'refund']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});
```

### 2. Create the Service
```typescript
// lib/services/dispute.service.ts
export async function createDispute(data: DisputeInput) {
  // Business logic here
}
```

### 3. Create Server Action
```typescript
// lib/actions/dispute.actions.ts
'use server';
export async function createDisputeAction(formData: FormData) {
  // Validation + service call + revalidation
}
```

### 4. Create Query (if needed)
```typescript
// lib/queries/dispute.queries.ts
export const getDisputes = cache(async () => {
  // Fetch disputes
});
```

### 5. Create Page
```typescript
// app/(dashboard)/disputes/page.tsx
export default async function DisputesPage() {
  const disputes = await getDisputes();
  return <DisputeList disputes={disputes} />;
}
```

### 6. Create Components
```typescript
// app/(dashboard)/disputes/_components/DisputeList.tsx
// app/(dashboard)/disputes/_components/DisputeCard.tsx
// app/(dashboard)/disputes/_components/DisputeForm.tsx
```

---

## ❌ Never Do This

### 1. Large Files
```typescript
// ❌ BAD: 500-line component
export function GiantComponent() {
  // 500 lines of code
}

// ✅ GOOD: Split into smaller components
export function ParentComponent() {
  return (
    <>
      <Header />
      <Content />
      <Footer />
    </>
  );
}
```

### 2. Custom UI Components
```typescript
// ❌ BAD: Creating custom button
// components/MyButton.tsx
export function MyButton() {
  return <button className="...">Click</button>;
}

// ✅ GOOD: Use shadcn/ui
import { Button } from '@/components/ui/button';
export function MyFeature() {
  return <Button>Click</Button>;
}
```

### 3. Business Logic in Components
```typescript
// ❌ BAD: Database queries in component
export function ProductList() {
  const products = await db.product.findMany();
  // ...
}

// ✅ GOOD: Use services and queries
export async function ProductList() {
  const products = await getProducts(); // from queries
  // ...
}
```

### 4. Unnecessary Client Components
```typescript
// ❌ BAD: Client component for static content
'use client';
export function Header() {
  return <h1>Title</h1>;
}

// ✅ GOOD: Server component (default)
export function Header() {
  return <h1>Title</h1>;
}
```

### 5. API Routes for Mutations
```typescript
// ❌ BAD: API route for simple mutation
// app/api/products/route.ts
export async function POST(req: Request) {
  // ...
}

// ✅ GOOD: Server action
// lib/actions/product.actions.ts
'use server';
export async function createProduct(data: FormData) {
  // ...
}
```

### 6. Props Drilling
```typescript
// ❌ BAD: Passing props through many levels
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user} />
  </Child>
</Parent>

// ✅ GOOD: Use Context or Server Actions
// providers/AuthProvider.tsx
<AuthProvider>
  <Parent>
    <Child>
      <GrandChild /> {/* Gets user from context */}
    </Child>
  </Parent>
</AuthProvider>
```

---

## 🔍 Code Review Checklist

Before considering any code complete, verify:

- [ ] No file exceeds 150 lines
- [ ] Server Component by default (unless needs 'use client')
- [ ] All functions have explicit return types
- [ ] No `any` types used
- [ ] Zod validation for all external inputs
- [ ] Proper error handling (try/catch or error boundaries)
- [ ] Imports are organized (React → Next → External → Internal)
- [ ] Component follows single responsibility principle
- [ ] No duplicate code (DRY principle)
- [ ] Proper TypeScript types (no implicit any)
- [ ] Constants extracted (no magic numbers/strings)
- [ ] Naming follows conventions
- [ ] File is in correct directory

---

## 🚀 Common Tasks

### Adding a New Route
1. Create folder in appropriate route group
2. Create `page.tsx` (Server Component)
3. Create `_components/` folder for route-specific components
4. Update navigation if needed

### Adding a New API Route
Only create API routes for:
- File uploads
- Webhooks (Stripe, etc.)
- Third-party integrations

For mutations, use Server Actions instead!

### Updating Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description_of_change`
3. Update related types/validations
4. Update services/queries

---

## 📚 Key Files Reference

```
Database:           lib/db/client.ts
Auth:               app/api/auth/[...nextauth]/route.ts
Middleware:         middleware.ts
Utils:              lib/utils/*.ts
Types:              lib/types/*.types.ts
Constants:          lib/constants/*.ts
```

---

## 💡 Best Practices

1. **Prefer composition over inheritance**
2. **Keep functions pure when possible**
3. **Use TypeScript's type system fully**
4. **Write self-documenting code (clear names)**
5. **Extract magic numbers/strings to constants**
6. **Handle errors explicitly**
7. **Validate at boundaries (inputs, API calls)**
8. **Use Server Components for better performance**
9. **Optimize for readability over cleverness**
10. **When in doubt, split the file**

---

## 🆘 When You're Unsure

If you're unsure about:
- **File organization** → Check this guide's structure section
- **Naming** → Check naming conventions section
- **Component type** → Default to Server Component
- **File size** → If over 100 lines, consider splitting
- **Where to put logic** → Business logic goes in services

---

**Remember:** The goal is maintainable, scalable code that your friend can understand and modify easily. When in doubt, favor clarity over cleverness.
