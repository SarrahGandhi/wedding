-- Task access follows the application's invite-only admin authentication model.
create table public.tasks (
  id integer generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  owner text not null check (char_length(btrim(owner)) between 1 and 120),
  side public.guest_side not null,
  due_date date not null check (due_date between date '0001-01-01' and date '9999-12-31'),
  completed boolean not null default false,
  revision integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
revoke all on table public.tasks from anon;
grant select, insert, update, delete on table public.tasks to authenticated, service_role;
grant usage, select on sequence public.tasks_id_seq to authenticated, service_role;

create policy "Admins can manage tasks"
  on public.tasks for all to authenticated
  using (true) with check (true);

create function public.bump_task_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;

create trigger task_revision
before update on public.tasks
for each row execute function public.bump_task_revision();
