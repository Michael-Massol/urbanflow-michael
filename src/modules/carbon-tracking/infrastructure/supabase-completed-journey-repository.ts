import type { SupabaseClient } from "@supabase/supabase-js";
import type { JourneyMode } from "../../journey-planning/domain/models.ts";
import type { CompletedJourney, CompletedJourneyDraft, CompletedJourneyRepository } from "../domain/models.ts";

interface CompletedJourneyRow {
  id: string;
  user_id: string;
  origin_label: string;
  destination_label: string;
  departure_at: string;
  arrival_at: string;
  duration_minutes: number;
  distance_meters: number;
  modes: JourneyMode[];
  emissions_grams_co2e: number;
  car_reference_grams_co2e: number;
  avoided_grams_co2e: number;
  factor_version: string;
  provider: string;
  confirmed_at: string;
}

const columns = "id, user_id, origin_label, destination_label, departure_at, arrival_at, duration_minutes, distance_meters, modes, emissions_grams_co2e, car_reference_grams_co2e, avoided_grams_co2e, factor_version, provider, confirmed_at";

function toDomain(row: CompletedJourneyRow): CompletedJourney {
  return {
    id: row.id, userId: row.user_id, originLabel: row.origin_label, destinationLabel: row.destination_label,
    departureAt: row.departure_at, arrivalAt: row.arrival_at, durationMinutes: row.duration_minutes,
    distanceMeters: row.distance_meters, modes: row.modes, emissionsGramsCo2e: row.emissions_grams_co2e,
    carReferenceGramsCo2e: row.car_reference_grams_co2e, avoidedGramsCo2e: row.avoided_grams_co2e,
    factorVersion: row.factor_version, provider: row.provider, confirmedAt: row.confirmed_at,
  };
}

export class SupabaseCompletedJourneyRepository implements CompletedJourneyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(journey: CompletedJourneyDraft): Promise<CompletedJourney> {
    const { data, error } = await this.client.from("completed_journeys").insert({
      user_id: journey.userId,
      origin_label: journey.originLabel,
      destination_label: journey.destinationLabel,
      departure_at: journey.departureAt,
      arrival_at: journey.arrivalAt,
      duration_minutes: journey.durationMinutes,
      distance_meters: journey.distanceMeters,
      modes: journey.modes,
      emissions_grams_co2e: journey.emissionsGramsCo2e,
      car_reference_grams_co2e: journey.carReferenceGramsCo2e,
      avoided_grams_co2e: journey.avoidedGramsCo2e,
      factor_version: journey.factorVersion,
      provider: journey.provider,
    }).select(columns).single<CompletedJourneyRow>();
    if (error || !data) throw new Error("Impossible d’enregistrer le trajet confirmé.");
    return toDomain(data);
  }

  async listByUserId(userId: string): Promise<CompletedJourney[]> {
    const { data, error } = await this.client.from("completed_journeys")
      .select(columns).eq("user_id", userId).order("confirmed_at", { ascending: false })
      .returns<CompletedJourneyRow[]>();
    if (error) throw new Error("Impossible de charger l’historique des trajets.");
    return (data ?? []).map(toDomain);
  }

  async deleteById(userId: string, journeyId: string): Promise<boolean> {
    const { data, error } = await this.client.from("completed_journeys")
      .delete()
      .eq("user_id", userId)
      .eq("id", journeyId)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) throw new Error("Impossible de supprimer le trajet confirmé.");
    return data !== null;
  }
}
