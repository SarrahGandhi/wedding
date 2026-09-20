-- Existing tasks start on the bride side and can be reassigned in the admin UI.
alter table public.tasks
  add column side public.guest_side not null default 'BRIDE';

-- New tasks must explicitly supply the side selected in the task form.
alter table public.tasks alter column side drop default;
