"use client";

import { useFormStatus } from "react-dom";
import { deleteCompletedJourneyAction } from "./history-actions";

function DeleteButton() {
  const { pending } = useFormStatus();
  return <button className="button button-danger" type="submit" disabled={pending}>{pending ? "Suppression…" : "Supprimer"}</button>;
}

export function DeleteCompletedJourneyForm({ journeyId }: { journeyId: string }) {
  return (
    <form
      action={deleteCompletedJourneyAction}
      onSubmit={(event) => {
        if (!window.confirm("Supprimer définitivement ce trajet de votre historique ?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="journeyId" value={journeyId} />
      <DeleteButton />
    </form>
  );
}
