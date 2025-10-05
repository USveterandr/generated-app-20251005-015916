export interface SimulationParams {
  initialAge: number;
  retirementAge: number;
  initialPortfolioValue: number;
  monthlyContribution: number;
  meanReturn: number; // Annual return as a decimal, e.g., 0.07 for 7%
  stdDev: number; // Annual standard deviation as a decimal
  numSimulations?: number;
  inflationRate?: number;
}
export interface SimulationResult {
  year: number;
  p10: number;
  p50: number;
  p90: number;
}
// Generate a random number from a normal distribution
function randomNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}
export function runMonteCarloSimulation(params: SimulationParams): SimulationResult[] {
  const {
    initialAge,
    retirementAge,
    initialPortfolioValue,
    monthlyContribution,
    meanReturn,
    stdDev,
    numSimulations = 1000,
    inflationRate = 0.025,
  } = params;
  const yearsToSimulate = retirementAge - initialAge;
  if (yearsToSimulate <= 0) return [];
  const monthlyReturn = meanReturn / 12;
  const monthlyStdDev = stdDev / Math.sqrt(12);
  const monthlyInflation = inflationRate / 12;
  const allSimulations: number[][] = [];
  for (let i = 0; i < numSimulations; i++) {
    const simulationPath: number[] = [];
    let portfolioValue = initialPortfolioValue;
    for (let year = 0; year < yearsToSimulate; year++) {
      for (let month = 0; month < 12; month++) {
        const monthlyGrowth = randomNormal(monthlyReturn, monthlyStdDev);
        portfolioValue *= (1 + monthlyGrowth);
        portfolioValue += monthlyContribution;
      }
      // Adjust for inflation at the end of the year
      const inflationAdjustedValue = portfolioValue / Math.pow(1 + inflationRate, year + 1);
      simulationPath.push(inflationAdjustedValue);
    }
    allSimulations.push(simulationPath);
  }
  const results: SimulationResult[] = [];
  for (let year = 0; year < yearsToSimulate; year++) {
    const valuesForYear = allSimulations.map(sim => sim[year]).sort((a, b) => a - b);
    const p10Index = Math.floor(numSimulations * 0.10);
    const p50Index = Math.floor(numSimulations * 0.50);
    const p90Index = Math.floor(numSimulations * 0.90);
    results.push({
      year: initialAge + year + 1,
      p10: valuesForYear[p10Index],
      p50: valuesForYear[p50Index],
      p90: valuesForYear[p90Index],
    });
  }
  return results;
}