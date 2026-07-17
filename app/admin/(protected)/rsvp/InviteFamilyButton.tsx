"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/shared/Button";
import { ErrorMessage } from "@/app/shared/ErrorMessage";
import { useServerAction } from "@/app/shared/useServerAction";
import { inviteFamilyToAllEvents } from "./actions";

export function InviteFamilyButton({
  familyId,
  allInvited,
}: {
  familyId: number;
  allInvited: boolean;
}) {
  const router = useRouter();
  const inviteAll = useServerAction(inviteFamilyToAllEvents);

  function onInviteAll() {
    const formData = new FormData();
    formData.append("family_id", String(familyId));
    inviteAll.run(formData, {
      onSuccess: () => router.refresh(),
    });
  }

  return (
    <span className="inline-flex items-center gap-3">
      <Button
        variant="secondary"
        onClick={onInviteAll}
        pending={inviteAll.pending}
        disabled={allInvited}
        aria-label={`Invite every member of family ${familyId} to every event`}
      >
        {inviteAll.pending
          ? "Inviting…"
          : allInvited
            ? "All invited"
            : "Invite all"}
      </Button>
      {inviteAll.error && (
        <ErrorMessage variant="badge">{inviteAll.error}</ErrorMessage>
      )}
    </span>
  );
}
