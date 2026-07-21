# PUCYCLES

Responsive motorcycle-parts storefront and admin system built with Next.js and Supabase.

## Requirements

- Node.js 22 or newer
- A Supabase project

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the project values.
3. For a new Supabase database, run migrations `001`, `002`, then `004` through `009` from `supabase/migrations` in order.
4. Create the dedicated admin account by following `ADMIN_ACCOUNT_SETUP.md`.
5. Start the app with `npm run dev`.

Migration `003` was an incomplete local file and is intentionally excluded. Migration `004` is its complete replacement.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_LOGIN_EMAIL=admin@pucycles.local
```

Never store the admin password, service-role key, or `.env.local` in Git.

## Deployment and data

The Next.js app can be deployed to Vercel or another Node.js host. Products, stock, orders, users, payment proofs, and product images are stored in Supabase Postgres/Auth/Storage, not on the web host.

Changing the web host keeps all existing data when the new deployment uses the same Supabase project and environment values. Moving to a different Supabase project requires a database and Storage migration.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
