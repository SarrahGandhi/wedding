type Reply = { guest_id: number; rsvp_status: string };

// A guest who accepts several events is still only one confirmed person.
export function confirmedGuestCount(replies: readonly Reply[]) {
  return new Set(replies.filter((reply) => reply.rsvp_status === "ACCEPTED").map((reply) => reply.guest_id)).size;
}
