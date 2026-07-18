"use client";

import { useActionState } from "react";
import { ACCOUNT_DELETION_CONFIRMATION } from "../domain/models";
import {
  deleteAccountAction,
  type DeleteAccountActionState,
} from "./privacy-actions";

const initialState: DeleteAccountActionState = { status: "idle" };

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, initialState);

  return (
    <form action={action} className="form-stack danger-zone">
      <div className="field">
        <label htmlFor="confirmation">
          Pour confirmer, saisissez <strong>{ACCOUNT_DELETION_CONFIRMATION}</strong>
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="text"
          autoComplete="off"
          required
          aria-describedby="account-deletion-help"
        />
        <p className="field-hint" id="account-deletion-help">
          Cette opération supprime définitivement le profil, les préférences et tous les trajets confirmés.
        </p>
      </div>
      <label className="checkbox-field">
        <input name="acknowledge" type="checkbox" required />
        Je comprends que cette suppression est irréversible.
      </label>
      {state.message ? <p className="form-message" role="alert">{state.message}</p> : null}
      <button className="button button-danger" type="submit" disabled={pending}>
        {pending ? "Suppression en cours…" : "Supprimer définitivement mon compte"}
      </button>
    </form>
  );
}
