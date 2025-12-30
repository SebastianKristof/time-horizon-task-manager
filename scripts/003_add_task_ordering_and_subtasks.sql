-- Add position field for task ordering within horizon
alter table public.tasks add column if not exists position integer not null default 0;

-- Add parent_task_id field for subtasks
alter table public.tasks add column if not exists parent_task_id uuid;

-- Add check constraint to prevent circular references
alter table public.tasks drop constraint if exists tasks_no_self_parent;
alter table public.tasks add constraint tasks_no_self_parent check (parent_task_id != id);

-- Add foreign key constraint for parent_task_id (self-referential)
alter table public.tasks drop constraint if exists tasks_parent_task_id_fkey;
alter table public.tasks add constraint tasks_parent_task_id_fkey 
  foreign key (parent_task_id) references public.tasks(id) on delete cascade;

-- Create indexes for performance
create index if not exists tasks_position_idx on public.tasks(position);
create index if not exists tasks_parent_task_id_idx on public.tasks(parent_task_id);

-- Backfill positions for existing tasks
-- First, backfill positions for top-level tasks (parent_task_id IS NULL) within each horizon
update public.tasks t
set position = sub.row_num - 1
from (
  select 
    id,
    row_number() over (partition by time_horizon order by created_at asc) as row_num
  from public.tasks
  where parent_task_id is null
) sub
where t.id = sub.id and t.parent_task_id is null;

-- Then, backfill positions for subtasks within each parent group
update public.tasks t
set position = sub.row_num - 1
from (
  select 
    id,
    row_number() over (partition by parent_task_id order by created_at asc) as row_num
  from public.tasks
  where parent_task_id is not null
) sub
where t.id = sub.id and t.parent_task_id is not null;