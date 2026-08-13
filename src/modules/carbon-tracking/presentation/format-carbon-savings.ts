const percentageFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatCarbonSavingsPercentage(
  avoidedGramsCo2e: number,
  carReferenceGramsCo2e: number,
): string | null {
  if (
    !Number.isFinite(avoidedGramsCo2e)
    || !Number.isFinite(carReferenceGramsCo2e)
    || carReferenceGramsCo2e <= 0
  ) return null;

  const percentage = Math.max(0, avoidedGramsCo2e) / carReferenceGramsCo2e * 100;
  return percentage === 0 ? "0 %" : `−${percentageFormatter.format(percentage)} %`;
}
