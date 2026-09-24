-- Existing families continue to need arrangements until explicitly unchecked.
alter table public.family_logistics
    add column if not exists arrival_support_required boolean not null default true;

notify pgrst, 'reload schema';
