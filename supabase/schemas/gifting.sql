-- Resolve the current account email from auth.users, rather than trusting client
-- input or an old JWT email claim. No other admin receives gifting access.
create function public.can_access_gifting()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users
    where id = (select auth.uid())
      and lower(email) = 'thesarrahgandhi@gmail.com'
      and email_confirmed_at is not null
  );
$$;
revoke all on function public.can_access_gifting() from public, anon;
grant execute on function public.can_access_gifting() to authenticated;

-- Array order preserves the custom ordering at every level. Creative requirements
-- belong to categories inside recipients, never to individual gifts.
create table public.gifting_plans (
  owner_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  recipients jsonb not null default '[]'::jsonb
    check (jsonb_typeof(recipients) = 'array' and octet_length(recipients::text) <= 1000000),
  revision integer not null default 1 check (revision > 0)
);
alter table public.gifting_plans enable row level security;
revoke all on public.gifting_plans from anon, authenticated;
grant select, insert, update on public.gifting_plans to authenticated;
grant all on public.gifting_plans to service_role;
create policy "Only Sarrah can access her gifting plan"
  on public.gifting_plans for all to authenticated
  using (owner_id = (select auth.uid()) and (select public.can_access_gifting()))
  with check (owner_id = (select auth.uid()) and (select public.can_access_gifting()));

create function public.bump_gifting_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;
create trigger gifting_revision before update on public.gifting_plans
for each row execute function public.bump_gifting_revision();
