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

# Authentication Redirects
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

## Authentication Flow
- **Email/Password**: standard sign-up and sign-in.
- **Google OAuth**: requires setting up a Google Cloud Project and adding the Client ID/Secret to your Supabase Auth settings.
- **Middleware**: ensure `proxy.ts` is configured correctly to protect app routes.

## Key Screens
- `/`: Landing page
- `/auth/login`: Sign in
- `/auth/sign-up`: Register
- `/horizons`: Main dashboard
- `/capture`: Add tasks
