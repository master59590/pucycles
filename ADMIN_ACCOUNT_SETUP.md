# PUCYCLES Admin Account Setup

The admin area uses a dedicated Supabase Email/Password account. Customer Google accounts cannot open the admin area.

## One-time setup

1. Open the Supabase SQL Editor. For a new database, run migrations `001`, `002`, then `004` through `009` in order. For an existing database, run only the migrations that have not been applied yet.
2. Open **Authentication > Users > Add user > Create new user**.
3. Use `admin@pucycles.local` as the email.
4. Create a strong, unique password with at least 12 characters.
5. Enable **Auto Confirm User** when creating the account.
6. Confirm `.env.local` contains the same email:

```env
ADMIN_LOGIN_EMAIL=admin@pucycles.local
```

7. Restart the development server, then open `/admin`.

## Vercel production setup

Add these values under **Project Settings > Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=https://your-domain.example
ADMIN_LOGIN_EMAIL=admin@pucycles.local
```

Apply them to **Production** and to **Preview** when testing a preview deployment, then redeploy the project. Vercel does not need the admin password.

## Login troubleshooting

Run this query in the Supabase SQL Editor:

```sql
select
  p.email,
  p.role,
  u.email_confirmed_at,
  u.raw_app_meta_data ->> 'provider' as provider
from public.profiles p
join auth.users u on u.id = p.id
where lower(p.email) = 'admin@pucycles.local';
```

The result must show `role = admin`, `provider = email`, and a non-null `email_confirmed_at`. No result means the Auth user has not been created. A `customer` role means migration `007` has not been applied for that account; run `007` again, then retry.

Migration `003` is intentionally excluded from Git because it was an incomplete local file. Migration `004` contains its complete replacement.

Do not put the admin password in Vercel, `.env.local`, source code, Git, or chat. Supabase Auth stores and verifies the password securely.

To use another admin email, change the email in migration `007`, `ADMIN_LOGIN_EMAIL`, and the Supabase Auth user so all three match.
