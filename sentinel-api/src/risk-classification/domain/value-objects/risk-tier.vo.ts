export enum RiskTier {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export const isHigherOrEqualTier = (a: RiskTier, b: RiskTier): boolean => {
  const order: Record<RiskTier, number> = {
    [RiskTier.HIGH]: 3,
    [RiskTier.MEDIUM]: 2,
    [RiskTier.LOW]: 1,
  };
  return order[a] >= order[b];
};
