-- Allow public read access to snapshots for sharing
-- This enables anyone with the link to view a snapshot

drop policy if exists "snapshots_select_own" on public.snapshots;

-- Policy for authenticated users to view their own snapshots
create policy "snapshots_select_own"
  on public.snapshots for select
  using (auth.uid() = user_id);

-- Policy for public read access to shared snapshots
drop policy if exists "snapshots_select_public" on public.snapshots;
create policy "snapshots_select_public"
  on public.snapshots for select
  using (true);

-- Keep insert and delete policies restricted to owners only
