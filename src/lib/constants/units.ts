/**
 * Supported measurement units
 */

export const SUPPORTED_UNITS = ['KG', 'G', 'L', 'ML', 'CL', 'PC', 'BUNCH', 'CLOVE'] as const;

export type SupportedUnit = (typeof SUPPORTED_UNITS)[number];

export const UNIT_LABELS: Record<SupportedUnit, string> = {
  // Weight
  KG: 'Kilogrammes',
  G: 'Grammes',
  // Volume
  L: 'Litres',
  ML: 'Millilitres',
  CL: 'Centilitres',
  // Count
  PC: 'Pièces',
  BUNCH: 'Botte',
  CLOVE: 'Gousse',
};

export const UNIT_ABBREVIATIONS: Record<SupportedUnit, string> = {
  // Weight
  KG: 'kg',
  G: 'g',
  // Volume
  L: 'l',
  ML: 'ml',
  CL: 'cl',
  // Count
  PC: 'pc',
  BUNCH: 'botte',
  CLOVE: 'gousse',
};
