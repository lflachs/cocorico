/**
 * Supported measurement units
 */

export const SUPPORTED_UNITS = ['KG', 'L', 'PC'] as const;

export type SupportedUnit = (typeof SUPPORTED_UNITS)[number];

export const UNIT_LABELS: Record<SupportedUnit, string> = {
  KG: 'Kilograms',
  L: 'Liters',
  PC: 'Pieces',
};

export const UNIT_ABBREVIATIONS: Record<SupportedUnit, string> = {
  KG: 'kg',
  L: 'l',
  PC: 'pc',
};
