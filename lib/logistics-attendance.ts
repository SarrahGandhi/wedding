type Guest = { id: number; name: string; family_id: number };
type Reply = { guest_id: number; rsvp_status: string };

// A person attending any event needs to be counted once, even with several yeses.
// A declined or pending reply never makes the rest of their family attending.
export function attendingGuestsByFamily(guests: readonly Guest[], replies: readonly Reply[]) {
  const attendingIds = new Set(replies.filter((reply) => reply.rsvp_status === "ACCEPTED").map((reply) => reply.guest_id));
  const counted = new Set<number>();
  const families = new Map<number, { id: number; name: string }[]>();
  for (const guest of guests) {
    if (!attendingIds.has(guest.id) || counted.has(guest.id)) continue;
    counted.add(guest.id);
    const members = families.get(guest.family_id) ?? [];
    members.push({ id: guest.id, name: guest.name });
    families.set(guest.family_id, members);
  }
  return families;
}
