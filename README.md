# Time Horizon Task Manager

A task manager focused on calm attention management, organizing tasks across time horizons: now, soon, later, someday.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/svkristofs-projects/v0-time-horizon-task-manager)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/lgi1lu8cgi6)

## Local Development Setup

### Prerequisites

- Node.js 18+ and pnpm installed
- A Supabase project (create one at [supabase.com](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd v0-time-horizon-task-manager
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   You can find these values in your Supabase project dashboard under Settings → API.

4. **Set up the database**
   
   Run the SQL migration scripts in your Supabase SQL Editor (in order):
   - `scripts/001_create_tables.sql` - Creates the tasks and snapshots tables with RLS policies
   - `scripts/002_add_snapshot_rls_public.sql` - Adds public read access for shared snapshots
   - `scripts/003_add_task_ordering_and_subtasks.sql` - Adds position and parent_task_id fields for task ordering and subtasks

5. **Start the development server**
   ```bash
   pnpm dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Project Structure

- `app/` - Next.js app router pages and routes
- `components/` - React components including UI components from shadcn/ui
- `lib/` - Utility functions and Supabase client setup
- `scripts/` - SQL migration scripts for database setup

## Deployment

Your project is live at:

**[https://vercel.com/svkristofs-projects/v0-time-horizon-task-manager](https://vercel.com/svkristofs-projects/v0-time-horizon-task-manager)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository