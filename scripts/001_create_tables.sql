-- Create tasks table with time horizons
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  time_horizon text not null check (time_horizon in ('now', 'soon', 'later', 'someday')),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create snapshots table for retrospective sharing
create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  snapshot_data jsonb not null,
  created_at timestamptz not null default now()
);

-- Enable RLS on tasks table
alter table public.tasks enable row level security;

-- RLS policies for tasks
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Enable RLS on snapshots table
alter table public.snapshots enable row level security;

-- RLS policies for snapshots
drop policy if exists "snapshots_select_own" on public.snapshots;
create policy "snapshots_select_own"
  on public.snapshots for select
  using (auth.uid() = user_id);

drop policy if exists "snapshots_insert_own" on public.snapshots;
create policy "snapshots_insert_own"
  on public.snapshots for insert
  with check (auth.uid() = user_id);

drop policy if exists "snapshots_delete_own" on public.snapshots;
create policy "snapshots_delete_own"
  on public.snapshots for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add trigger to tasks table
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();

-- Create index for better query performance
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_time_horizon_idx on public.tasks(time_horizon);
create index if not exists tasks_completed_idx on public.tasks(completed);
create index if not exists snapshots_user_id_idx on public.snapshots(user_id);
