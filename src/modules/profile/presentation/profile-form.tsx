"use client";

import { useActionState } from "react";
import { transportModes, type MobilityMode } from "../domain/mobility-preferences";
import { updateProfileAction, type ProfileActionState } from "./profile-actions";

const initialProfileActionState: ProfileActionState = { status: "idle" };
const modeLabels: Record<MobilityMode, string> = {
  walking: "Marche",
  bike: "Vélo",
  metro: "Métro",
  bus: "Bus",
  tram: "Tram",
};

interface ProfileFormProps {
  displayName: string;
  preferredModes: MobilityMode[];
  avoidedModes: MobilityMode[];
  maxWalkingMinutes: number;
  reducedMobility: boolean;
}

export function ProfileForm(props: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfileAction, initialProfileActionState);
  return (
    <form action={action} className="form-stack">
      <div className="field">
        <label htmlFor="displayName">Nom affiché</label>
        <input id="displayName" name="displayName" type="text" defaultValue={props.displayName} minLength={2} maxLength={60} required />
        <p className="field-hint">Cette information peut être modifiée à tout moment.</p>
      </div>
      <fieldset className="field checkbox-group">
        <legend>Modes préférés</legend>
        {transportModes.map((mode) => (
          <label key={mode}><input name="preferredModes" type="checkbox" value={mode} defaultChecked={props.preferredModes.includes(mode)} /> {modeLabels[mode]}</label>
        ))}
      </fieldset>
      <fieldset className="field checkbox-group">
        <legend>Modes à éviter</legend>
        {transportModes.map((mode) => (
          <label key={mode}><input name="avoidedModes" type="checkbox" value={mode} defaultChecked={props.avoidedModes.includes(mode)} /> {modeLabels[mode]}</label>
        ))}
        <p className="field-hint">Un mode ne peut pas être à la fois préféré et évité.</p>
      </fieldset>
      <div className="field">
        <label htmlFor="maxWalkingMinutes">Durée maximale de marche</label>
        <div className="input-with-unit">
          <input id="maxWalkingMinutes" name="maxWalkingMinutes" type="number" min="0" max="120" step="1" defaultValue={props.maxWalkingMinutes} required />
          <span>minutes</span>
        </div>
      </div>
      <label className="checkbox-field">
        <input name="reducedMobility" type="checkbox" defaultChecked={props.reducedMobility} />
        Prendre en compte une mobilité réduite
      </label>
      {state.message ? <p className={`form-message ${state.status === "success" ? "form-message-success" : ""}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
      <button className="button" type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  );
}
