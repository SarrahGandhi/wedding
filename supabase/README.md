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

## Shopping list

The Shopping list tab at `/admin/tasks` separates bride-side and groom-side items.
Add or edit an item to choose its side and enter a recipient (a person or group),
with suggestions from saved recipients. Filter by recipient, place to buy, and
purchase status, or sort alphabetically by recipient or place to buy. The default
sort puts items still needed first, then orders by urgency.

Apply `migrations/20260920050000_shopping_list.sql`, followed by
`migrations/20260923000000_shopping_sides_recipients.sql`. Existing items start on
the bride side with no recipient; use Edit to assign them. Their other details
and purchased status are preserved. New and edited items require a recipient.
Run `node --experimental-strip-types --test tests/shopping-list.test.mjs`.

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
The optional “To be picked up by” field accepts a name and suggests names already
used for confirmed families. Clear it to remove the assignment. Sort by pickup
name to group families alphabetically, with unassigned families last.
Apply `20260923010000_logistics_pickup.sql` to enable pickup assignments. Existing
records remain unassigned, and older clients preserve saved pickup names.

Accommodation counts and guest lists use individual accepted RSVPs only: two
accepted guests and one declined guest in a family contribute two people. Pending
or declined-only guests are excluded. A guest accepted for one event still counts
if they declined another. Family headings use the saved family name or the names
of attending members. RSVP changes and removals refresh the logistics and
accommodation pages. No database migration is required for this attendance logic.
Run `node --experimental-strip-types --test tests/logistics-attendance.test.mjs`.

Arrival and Departure are separate tabs on `/admin/logistics`. Departure records
have their own optional travel method, date, notes, and “To be dropped by” name.
Sort departures by date or drop-off name, or filter for incomplete plans and
unassigned drop-offs. Each tab retains its filters and open forms when switching.
Apply `20260923020000_logistics_departures.sql` after the pickup migration.
Departure saves update only departure columns; arrival saves preserve departures.
Both use the same authenticated-admin and confirmed-family access rules.

Arrival forms support multiple pickups per family. Each pickup has optional
guest names, arrival date, travel method, notes, and pickup person. Add a pickup
for each group arriving together; remove entries and save to delete them.
Apply `20260923030000_multiple_arrivals.sql` after the departure migration.
Existing single arrivals remain visible as the first entry until edited. Saving
the list and accommodation is atomic and preserves departure details. Date sorting
uses the earliest arrival; pickup-person sorting uses the first name alphabetically
across all entries. The incomplete-travel filter checks every pickup.

Uncheck “Pickup and accommodation required” on a family’s Arrival entry for
local families. They remain visible in Logistics, including a dedicated filter,
but are excluded from incomplete-travel and awaiting-accommodation lists and
accommodation occupancy counts. Checking it again restores their saved plans.
The flag does not change departure details or delete any arrival/accommodation data.
Apply `20260923040000_optional_arrival_support.sql` to enable this setting;
existing families default to requiring arrangements.

Arrival entries support optional times at minute precision in India Standard Time
(IST). Use “Group by arrival date and time” to see pickups across families at the
same exact date and time. This view honors the active family filters and excludes
families that do not need arrangements. Unknown times are kept separate, after
known times on that date; unknown dates are last. Family and accommodation arrival
sorts use the earliest date and time across all of a family’s pickups.
Apply `20260923050000_arrival_times.sql` to enable time validation and chronological
summaries. Existing dates are retained with no assumed time; departure dates are
unchanged. Times are stored as local `HH:mm` values, independent of browser timezone.

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
