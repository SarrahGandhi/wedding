# Database

## Events
This table contains the number of events for the wedding and the details such as dates, location, dress code, descriptions/details

## Guests
This table contains all the guests, which category they fall in and their family link

## Guest Families
Stores the details of the family such as the emails for invite and reminders and which side of the wedding they belong to.

## Event Guests RSVP
This tables contains which guests are invited to which events and they rsvp status

## Budgeting

The admin page at `/admin/budgeting` stores expenses in `budget_categories`.
Each category contains a name, optional vendor and notes, total cost, split,
and cumulative amounts paid by the bride and groom. Use separate categories
for separate vendor costs; matching vendor names are combined in the vendor tally.

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
