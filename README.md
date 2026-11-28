# Time Horizon Task Manager

I built this to explore whether sorting tasks by when they need attention could make a backlog easier to use. Each task belongs to **Now**, **Soon**, **Later**, or **Someday**. Moving a task between horizons is the main interaction.

Try a single planning session. Capture the tasks on your mind, decide what belongs in **Now**, and sort the rest by how soon you need to revisit them. Add subtasks when a task needs to be broken down, and share a snapshot if someone else needs to see your plan.

## Design notes

- Tasks have an explicit position within each horizon. Reordering keeps that position.
- Supabase stores tasks and handles sign-in. The migrations define row-level security for task access.
- A shared snapshot captures a saved view. Snapshot contents are publicly readable, so share only material intended for public viewing.

## Run locally

Use Node.js 22+, pnpm 10, and a Supabase project.

~~~sh
git clone https://github.com/SebastianKristof/time-horizon-task-manager.git
cd time-horizon-task-manager
pnpm install --frozen-lockfile
cp .env.example .env.local
~~~

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Apply the editable SQL migrations from [`scripts/`](scripts/) in order in the Supabase SQL Editor. If you have `psql` and a database connection URL, set `DATABASE_URL` and run `pnpm db:migrate` instead. Then run `pnpm dev` and open [localhost:3000](http://localhost:3000).

## Checks

~~~sh
pnpm test --run
pnpm build
~~~

The [testing guide](tests/README.md) describes the Vitest suites and how to run the Playwright journeys. The app uses Next.js, React, TypeScript, and Supabase.
