# Cocorico

A full-stack restaurant management platform built with Next.js 15, designed to help restaurant owners manage their daily operations — from inventory and stock movements to bills, menus, sales tracking, and food cost analysis.

## Tech Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript**, **Prisma**, **PostgreSQL**
- **Tailwind CSS** + **shadcn/ui**
- **NextAuth v5** for authentication
- **Azure Document Intelligence** for receipt/bill OCR

## Getting Started

```bash
cp .env.example .env   # Configure your environment variables
npm install
npx prisma migrate dev
npm run dev
```

## License

MIT
