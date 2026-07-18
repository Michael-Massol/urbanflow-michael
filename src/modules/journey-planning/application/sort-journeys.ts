import type { Journey, JourneyMode, JourneySort } from "../domain/models.ts";

function compareNumber(first: number, second: number): number {
  return first - second;
}

export function sortJourneys(
  journeys: readonly Journey[],
  sort: JourneySort,
  preferredModes: readonly JourneyMode[] = [],
): Journey[] {
  const preferred = new Set(preferredModes);
  const score = (journey: Journey) =>
    journey.durationMinutes + journey.walkingMinutes * 1.5 + journey.transferCount * 6 - journey.modes.filter((mode) => preferred.has(mode)).length * 3;
  return [...journeys].sort((first, second) => {
    let comparison = 0;
    if (sort === "fastest") comparison = compareNumber(first.durationMinutes, second.durationMinutes);
    else if (sort === "least-walking") comparison = compareNumber(first.walkingMinutes, second.walkingMinutes);
    else if (sort === "fewest-transfers") comparison = compareNumber(first.transferCount, second.transferCount);
    else comparison = compareNumber(score(first), score(second));
    return comparison || first.id.localeCompare(second.id);
  });
}
