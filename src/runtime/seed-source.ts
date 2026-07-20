export interface SeedSource {
  isAvailable(): boolean;
  nextSeed(): number | null;
}
