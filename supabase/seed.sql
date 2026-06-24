begin;

-- Reset application tables so the seed stays deterministic across db resets.
truncate table public.event_guests_rsvp, public.guests, public.events, public.guest_families
restart identity cascade;

-- Seed guest family/contact groups.
insert into public.guest_families (email, phone, side)
values
  (array['amina.rahman@example.com', 'karim.rahman@example.com'], '+1-555-0101', 'BRIDE'),
  (array['fatima.ali@example.com'], '+1-555-0102', 'BRIDE'),
  (array['omar.hassan@example.com', 'layla.hassan@example.com'], '+1-555-0103', 'GROOM'),
  (array['yusuf.khan@example.com'], '+1-555-0104', 'GROOM'),
  (array['samir.darwish@example.com', 'nadia.darwish@example.com'], '+1-555-0105', 'BRIDE'),
  (array['ibrahim.saeed@example.com'], '+1-555-0106', 'GROOM'),
  (array['zainab.rahman@example.com', 'adil.rahman@example.com'], '+1-555-0107', 'GROOM'),
  (array['mariam.hassan@example.com'], '+1-555-0108', 'BRIDE'),
  (array['rayyan.ali@example.com', 'noor.ali@example.com'], '+1-555-0109', 'GROOM');

-- Seed individual guests and attach them to their family group.
insert into public.guests (name, category, family_id)
values
  (
    'Amina Rahman',
    'FEMALE',
    (select id from public.guest_families where phone = '+1-555-0101')
  ),
  (
    'Karim Rahman',
    'MALE',
    (select id from public.guest_families where phone = '+1-555-0101')
  ),
  (
    'Sara Rahman',
    'CHILD',
    (select id from public.guest_families where phone = '+1-555-0101')
  ),
  (
    'Fatima Ali',
    'FEMALE',
    (select id from public.guest_families where phone = '+1-555-0102')
  ),
  (
    'Omar Hassan',
    'MALE',
    (select id from public.guest_families where phone = '+1-555-0103')
  ),
  (
    'Layla Hassan',
    'FEMALE',
    (select id from public.guest_families where phone = '+1-555-0103')
  ),
  (
    'Huda Hassan',
    'CHILD',
    (select id from public.guest_families where phone = '+1-555-0103')
  ),
  (
    'Yusuf Khan',
    'MALE',
    (select id from public.guest_families where phone = '+1-555-0104')
  ),
  (
    'Samir Darwish',
    'MALE',
    (select id from public.guest_families where phone = '+1-555-0105')
  ),
  (
    'Nadia Darwish',
    'FEMALE',
    (select id from public.guest_families where phone = '+1-555-0105')
  ),
  (
    'Leena Darwish',
    'CHILD',
    (select id from public.guest_families where phone = '+1-555-0105')
  ),
  (
    'Ibrahim Saeed',
    'MALE',
    (select id from public.guest_families where phone = '+1-555-0106')
  ),
  (
    'Zainab Rahman',
    'FEMALE',
    (select id from public.guest_families where phone = '+1-555-0107')
  ),
  (
    'Adil Rahman',
    'MALE',
    (select id from public.guest_families where phone = '+1-555-0107')
  ),
  (
    'Mariam Hassan',
    'FEMALE',
    (select id from public.guest_families where phone = '+1-555-0108')
  ),
  (
    'Rayyan Ali',
    'MALE',
    (select id from public.guest_families where phone = '+1-555-0109')
  ),
  (
    'Noor Ali',
    'CHILD',
    (select id from public.guest_families where phone = '+1-555-0109')
  );

-- Seed wedding-related events.
insert into public.events (name, date, location, dress_code, details)
values
  (
    'Henna Night',
    timestamp '2026-10-20 18:00',
    'Rose Garden Hall',
    'Traditional attire',
    'Join the family for an intimate evening of henna, sweets, and music before the wedding day.'
  ),
  (
    'Nikah Ceremony',
    timestamp '2026-10-22 11:00',
    'Masjid Al Noor',
    'Formal modest wear',
    'Please arrive 30 minutes early for seating. Ceremony will be followed by light refreshments.'
  ),
  (
    'Ring Ceremony',
    timestamp '2026-10-21 16:00',
    'Farmhouse Manor',
    'Pastel colors',
    'Full day event with food, ceremonial games and activities for all ages.'
  );

-- Seed RSVP rows with a mix of accepted, declined, and pending responses.
insert into public.event_guests_rsvp (event_id, guest_id, rsvp_status)
values
  (
    (select id from public.events where name = 'Henna Night'),
    (select id from public.guests where name = 'Amina Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Henna Night'),
    (select id from public.guests where name = 'Karim Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Henna Night'),
    (select id from public.guests where name = 'Sara Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Henna Night'),
    (select id from public.guests where name = 'Fatima Ali'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Henna Night'),
    (select id from public.guests where name = 'Nadia Darwish'),
    'PENDING'
  ),
  (
    (select id from public.events where name = 'Henna Night'),
    (select id from public.guests where name = 'Leena Darwish'),
    'PENDING'
  ),
  (
    (select id from public.events where name = 'Henna Night'),
    (select id from public.guests where name = 'Zainab Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Henna Night'),
    (select id from public.guests where name = 'Mariam Hassan'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Amina Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Karim Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Fatima Ali'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Omar Hassan'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Layla Hassan'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Huda Hassan'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Yusuf Khan'),
    'DECLINED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Samir Darwish'),
    'PENDING'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Nadia Darwish'),
    'PENDING'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Ibrahim Saeed'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Zainab Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Adil Rahman'),
    'DECLINED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Mariam Hassan'),
    'PENDING'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Rayyan Ali'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Nikah Ceremony'),
    (select id from public.guests where name = 'Noor Ali'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Amina Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Karim Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Sara Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Fatima Ali'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Omar Hassan'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Layla Hassan'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Huda Hassan'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Yusuf Khan'),
    'DECLINED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Samir Darwish'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Nadia Darwish'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Leena Darwish'),
    'PENDING'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Ibrahim Saeed'),
    'PENDING'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Zainab Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Adil Rahman'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Mariam Hassan'),
    'ACCEPTED'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Rayyan Ali'),
    'PENDING'
  ),
  (
    (select id from public.events where name = 'Ring Ceremony'),
    (select id from public.guests where name = 'Noor Ali'),
    'ACCEPTED'
  );

commit;
