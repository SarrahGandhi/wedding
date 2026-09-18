# Database

## Events
This table contains the number of events for the wedding and the details such as dates, location, dress code, descriptions/details

## Guests
This table contains all the guests, which category they fall in and their family link

## Guest Families
Stores the details of the family such as the emails for invite and reminders and which side of the wedding they belong to.

## Event Guests RSVP
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
