-- Match the task-side default; existing items can be reassigned through Edit.
alter table public.shopping_list_items
  add column side public.guest_side not null default 'BRIDE',
  add column recipient text
    check (recipient is null or char_length(btrim(recipient)) between 1 and 160);
