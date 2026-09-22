# Database

## Tasks

The admin page at `/admin/tasks` stores tasks with a required name, owner name,
due date, and completion status. Admins can add and edit tasks, mark them complete
or incomplete, and filter by status. Incomplete tasks appear first, ordered by due date.
The bride/groom toggle shows only the selected side’s tasks and completion count.
New tasks default to the selected side; the add/edit form can change their side.
Apply `migrations/20260920010000_task_sides.sql` after the task table migration.
Existing tasks start on the bride side and can be reassigned through Edit.
Tasks also support optional, multiline notes in the add/edit form and task list.
Apply `migrations/20260920020000_task_notes.sql` to enable notes. Clearing the field
removes the saved notes; existing tasks do not require notes.
Owner names are free text, with suggestions from existing tasks. Access follows the
existing invite-only admin model; anonymous visitors cannot access task data.
A revision check prevents stale forms from overwriting another admin’s changes.

Apply `migrations/20260920000000_admin_tasks.sql` before using the page, using the
existing `supabase db push` workflow for a linked deployment. Run validation tests
with `node --experimental-strip-types --test tests/tasks.test.mjs`.
Database checks in `supabase/tests/tasks.sql` verify editing, completion, stale
update protection, and anonymous access restrictions in a rolled-back transaction.

## Events
This table contains the number of events for the wedding and the details such as dates, location, dress code, descriptions/details

## Guests
This table contains all the guests, which category they fall in and their family link

## Guest Families
Stores the details of the family such as the emails for invite and reminders and which side of the wedding they belong to.

Fixed male/female guest counts are totals for the family, including names entered
by admins. Remaining spots subtract every existing guest of that category. All
mode permits additional names without a fixed limit. The public invitation lists
saved names separately from the remaining entry fields, including names without
event RSVP rows. Event invitations and existing replies are preserved.

Apply `migrations/20260920040000_family_guest_total_limits.sql` to enforce these
totals when families add names. Existing counts and names are not changed.
Run `node --experimental-strip-types --test tests/family-guest-slots.test.mjs`
and the rolled-back database checks in `supabase/tests/family_guest_limits.sql`.

## Event Guests RSVP
This tables contains which guests are invited to which events and they rsvp status

## Budgeting

The admin page at `/admin/budgeting` stores expenses in `budget_categories`.
Each category contains a name, optional vendor and notes, total cost, split,
and cumulative amounts paid by the bride and groom. Use separate categories
for separate vendor costs; matching vendor names are combined in the vendor tally.

Use **Add amount** within a category to record multiple costs. Amounts can be edited
or removed, and the total and assigned shares update automatically. Saved categories
show the individual amounts under **View amounts**. Existing categories retain their
total as a single amount when edited; recorded payments are unchanged.
Apply `migrations/20260920030000_budget_amounts.sql` before saving multiple amounts.
`amounts_paise` stores each cost in integer paise, and a database constraint verifies
that their sum matches `total_paise`. A null array represents a legacy single total.

- Currency is INR; money is stored as integer paise to preserve exact totals.
- Splits support groom only, bride only, 50/50, and a custom bride amount with
  the remainder assigned to the groom. An odd paise in a 50/50 split goes to the groom.
- Payments are running totals, not additional payment transactions. Either side
  may pay more than their assigned share. Vendor overpayments appear as credits.
- A credit only offsets other categories with the same vendor; categories without
  a vendor are kept separate. Total outstanding and total vendor credit are shown separately.
- Both server validation and database constraints enforce valid amounts and splits.
  A revision check prevents stale forms from overwriting another admin’s changes.
- Budget data is restricted to authenticated admins, following the app’s existing
  invite-only authentication model; anonymous guests cannot read or change it.

Apply `migrations/20260918120000_budget_categories.sql` before using the page.
For a linked deployment, use the existing `supabase db push` migration workflow.
Run calculation and validation tests with `node --test tests/budgeting.test.mjs`
(Node.js 22.18 or newer). `tests/budgeting.sql` also checks database constraints,
revision handling, and access restrictions inside a transaction that is rolled back.
This table contains which guests are invited to which events and their RSVP status.

## Logistics and accommodation

`/admin/logistics` lists families with at least one guest who has accepted an event.
Each confirmed guest is counted once across all events. Travel method, arrival
date, travel details, and accommodation can be saved independently as plans emerge.

`family_logistics` stores one plan per family. `accommodations` stores reusable
houses and hotel stays. Multiple families may share any accommodation. Hotels
require a name; room numbers are optional and can be assigned later. Houses
require a name and have no room number. Hotel stays without a room number are
shown as “Room not assigned” and sort after numbered rooms. They are excluded
from assigned-room counts and are not labeled as shared rooms.
The accommodation picker lists each hotel once. Select the existing hotel and
enter or choose the family's optional room number separately; a different room
does not require entering the hotel name again. Changing one family's room
preserves every other family's assignment.
Hotel names and room numbers are matched without regard to case or surrounding
spaces. `/admin/accommodation` groups families by house or hotel and supports
natural room-number sorting within each hotel.

Both tables and the transactional `save_family_logistics` function are restricted
to authenticated admins, following the existing admin authentication model. No
logistics details are exposed to anonymous invitation visitors. If a family later
has no accepted RSVPs, its saved plan is retained but hidden from these pages.

Apply `20260918000000_family_logistics.sql` and
`20260918010000_optional_hotel_rooms.sql` before using these pages:

```sh
pnpm supabase migration up --local
# For the linked production project when deploying:
pnpm supabase db push
```

Run logic checks with `pnpm test:logistics` (Node 22.18+). Database checks run in
a transaction and roll back their fixtures:

```sh
docker exec -i supabase_db_wedding psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/family_logistics.sql
```
