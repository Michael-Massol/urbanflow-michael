import type { SupabaseClient } from "@supabase/supabase-js";
import { journeyGeometrySchema } from "../../journey-planning/domain/schemas.ts";
import type { JourneyGeometry, JourneyMode } from "../../journey-planning/domain/models.ts";
import type { CompletedJourney, CompletedJourneyDraft, CompletedJourneyRepository } from "../domain/models.ts";

export interface CompletedJourneyRow {
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
  geometry_snapshot: unknown | null;
  confirmed_at: string;
}

const columns = "id, user_id, origin_label, destination_label, departure_at, arrival_at, duration_minutes, distance_meters, modes, emissions_grams_co2e, car_reference_grams_co2e, avoided_grams_co2e, factor_version, provider, geometry_snapshot, confirmed_at";

function parseStoredGeometry(value: unknown): JourneyGeometry | null {
  const parsed = journeyGeometrySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function completedJourneyRowToDomain(row: CompletedJourneyRow): CompletedJourney {
  return {
    id: row.id, userId: row.user_id, originLabel: row.origin_label, destinationLabel: row.destination_label,
    departureAt: row.departure_at, arrivalAt: row.arrival_at, durationMinutes: row.duration_minutes,
    distanceMeters: row.distance_meters, modes: row.modes, emissionsGramsCo2e: row.emissions_grams_co2e,
    carReferenceGramsCo2e: row.car_reference_grams_co2e, avoidedGramsCo2e: row.avoided_grams_co2e,
    factorVersion: row.factor_version, provider: row.provider,
    geometry: parseStoredGeometry(row.geometry_snapshot), confirmedAt: row.confirmed_at,
  };
}

export class SupabaseCompletedJourneyRepository implements CompletedJourneyRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

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
      geometry_snapshot: journey.geometry,
    }).select(columns).single<CompletedJourneyRow>();
    if (error || !data) throw new Error("Impossible d’enregistrer le trajet confirmé.");
    return completedJourneyRowToDomain(data);
  }

  async listByUserId(userId: string): Promise<CompletedJourney[]> {
    const { data, error } = await this.client.from("completed_journeys")
      .select(columns).eq("user_id", userId).order("confirmed_at", { ascending: false })
      .returns<CompletedJourneyRow[]>();
    if (error) throw new Error("Impossible de charger l’historique des trajets.");
    return (data ?? []).map(completedJourneyRowToDomain);
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
