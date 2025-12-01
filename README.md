# 🛍️ ShopSphere — E-Commerce Store + Admin Dashboard

A full-stack online store: customers browse products, manage a cart and check out, while admins manage inventory and orders and track sales from an analytics dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8)

## ✨ Features
- 🛒 Product catalog with search, category & price filters, and sorting
- 🧺 Cart and a full checkout flow with mock Stripe & Razorpay payment options
- 📦 Atomic stock handling — never oversells
- 📑 Customer order history and order detail
- 📊 Admin dashboard: product/inventory CRUD, order management, and sales charts
- 🔐 Secure JWT authentication with role-based access (Customer / Admin)

## 🛠 Tech Stack
- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript
- **UI:** Tailwind CSS v4 · shadcn/ui · Recharts
- **Database:** Prisma 7 · SQLite (libSQL adapter) — swappable to PostgreSQL
- **Auth:** Custom JWT (jose) + bcryptjs
- **Forms & validation:** React Hook Form · Zod

## 🚀 Run locally
```bash
pnpm install
pnpm prisma migrate dev
pnpm db:seed              # loads demo products, orders & users
pnpm dev
```
Open **http://localhost:3000**

## 🔑 Demo accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@shopsphere.dev` | `Admin@1234` |
| Customer | `priya@example.com` | `Customer@1234` |

## ☁️ Deployment
Deploys to Vercel. For production, switch the Prisma datasource to PostgreSQL (Neon/Supabase) and set `DATABASE_URL` and `AUTH_SECRET`. Payments are mocked — wire real Stripe/Razorpay keys to go live.

---
Built by **Rohit Malviya** — full-stack developer.
