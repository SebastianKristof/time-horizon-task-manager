# Development Reference Manual

## Environment Variables
To run this project locally, create a `.env.local` file in your root directory with the following variables. You can find these values in your Vercel Project Settings or Supabase Dashboard.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Connection
# POSTGRES_URL=... (If using Vercel Postgres/Neon)
DATABASE_URL=your_database_url
```

## Authentication Flow
- **Email/Password**: standard sign-up and sign-in.
- **Google OAuth**: requires setting up a Google Cloud Project and adding the Client ID/Secret to your Supabase Auth settings.
- **Middleware**: ensure `middleware.ts` is configured correctly to protect app routes.

## Supabase Auth Setup
1. Enable Google provider in Supabase Auth.
2. Create a Google OAuth client (Web application) and add:
   - Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
3. In Supabase Auth URL configuration:
   - Site URL: `http://localhost:3000` (local) and `https://time-horizon.vercel.app` (prod)
   - Additional redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `https://time-horizon.vercel.app/auth/callback`
     - `http://localhost:3000/auth/update-password`
     - `https://time-horizon.vercel.app/auth/update-password`

## Account Management
- **Delete account** uses the Supabase Admin API. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` to enable it.
- **Password reset** emails redirect to `/auth/update-password`.

## Key Screens
- `/`: Landing page
- `/auth/login`: Sign in
- `/auth/sign-up`: Register
- `/horizons`: Main dashboard
- `/capture`: Add tasks
