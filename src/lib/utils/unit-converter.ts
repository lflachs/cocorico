/**
 * Unit Converter
 * Handles conversion between different units of measurement
 */

type Unit = 'KG' | 'G' | 'L' | 'ML' | 'PC' | 'BOX' | 'BAG' | 'BUNCH' | 'PACK' | 'UNIT';

/**
 * Check if two units are compatible (can be converted)
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const weightUnits = ['KG', 'G'];
  const volumeUnits = ['L', 'ML'];
  const countUnits = ['PC', 'BOX', 'BAG', 'BUNCH', 'PACK', 'UNIT'];

  const u1 = unit1.toUpperCase();
  const u2 = unit2.toUpperCase();

  // Same unit is always compatible
  if (u1 === u2) return true;

  // Check if both are weight units
  if (weightUnits.includes(u1) && weightUnits.includes(u2)) return true;

  // Check if both are volume units
  if (volumeUnits.includes(u1) && volumeUnits.includes(u2)) return true;

  // Count units are not compatible with each other (different types of packaging)
  return false;
}

/**
 * Convert quantity from one unit to another
 * Returns null if units are incompatible
 */
export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const from = fromUnit.toUpperCase();
  const to = toUnit.toUpperCase();

  // No conversion needed
  if (from === to) return quantity;

  // Weight conversions
  if (from === 'G' && to === 'KG') return quantity / 1000;
  if (from === 'KG' && to === 'G') return quantity * 1000;

  // Volume conversions
  if (from === 'ML' && to === 'L') return quantity / 1000;
  if (from === 'L' && to === 'ML') return quantity * 1000;

  // Units are incompatible
  return null;
}

/**
 * Convert product to match inventory unit
 * Returns converted quantity and the target unit
 * If units are incompatible, uses inventory unit but keeps original quantity
 */
export function convertToInventoryUnit(
  quantity: number,
  currentUnit: string,
  inventoryUnit: string
): { quantity: number; unit: string; wasConverted: boolean; wasIncompatible: boolean } {
  // Check if units are compatible
  if (!areUnitsCompatible(currentUnit, inventoryUnit)) {
    // Can't convert - use inventory unit but keep quantity as-is
    // User will need to manually adjust the quantity
    return {
      quantity,
      unit: inventoryUnit, // ALWAYS use inventory unit for consistency
      wasConverted: false,
      wasIncompatible: true,
    };
  }

  // Try to convert
  const convertedQuantity = convertQuantity(quantity, currentUnit, inventoryUnit);

  if (convertedQuantity !== null) {
    return {
      quantity: convertedQuantity,
      unit: inventoryUnit,
      wasConverted: true,
      wasIncompatible: false,
    };
  }

  // Conversion failed - use inventory unit
  return {
    quantity,
    unit: inventoryUnit,
    wasConverted: false,
    wasIncompatible: false,
  };
}

/**
 * Get a human-readable description of the conversion
 */
export function getConversionDescription(
  originalQuantity: number,
  originalUnit: string,
  newQuantity: number,
  newUnit: string
): string {
  return `${originalQuantity} ${originalUnit} → ${newQuantity.toFixed(2)} ${newUnit}`;
}

/**
 * Format quantity to remove floating-point precision errors
 * Examples:
 *   1.600000000000005 -> 1.6
 *   10.0 -> 10
 *   3.333333333333333 -> 3.33
 */
export function formatQuantity(quantity: number, maxDecimals: number = 2): string {
  // Round to avoid floating-point precision errors
  const rounded = Math.round(quantity * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);

  // Convert to string and remove trailing zeros
  const str = rounded.toFixed(maxDecimals);

  // Remove trailing zeros after decimal point
  return str.replace(/\.?0+$/, '');
}

/**
 * Translate unit to French
 * @param unit - The unit code (e.g., "KG", "BUNCH", "PC")
 * @param quantity - Optional quantity for singular/plural forms
 */
export function translateUnit(unit: string, quantity?: number): string {
  const unitUpper = unit.toUpperCase();
  const isPlural = quantity !== undefined && quantity !== 1;

  const translations: Record<string, { singular: string; plural: string }> = {
    'KG': { singular: 'kg', plural: 'kg' },
    'G': { singular: 'g', plural: 'g' },
    'L': { singular: 'L', plural: 'L' },
    'ML': { singular: 'ml', plural: 'ml' },
    'CL': { singular: 'cl', plural: 'cl' },
    'PC': { singular: 'pce', plural: 'pces' },
    'BUNCH': { singular: 'botte', plural: 'bottes' },
    'CLOVE': { singular: 'gousse', plural: 'gousses' },
    'BOX': { singular: 'boîte', plural: 'boîtes' },
    'BAG': { singular: 'sac', plural: 'sacs' },
    'PACK': { singular: 'paquet', plural: 'paquets' },
    'UNIT': { singular: 'unité', plural: 'unités' },
  };

  const translation = translations[unitUpper];

  if (!translation) {
    // If no translation found, return lowercase version
    return unit.toLowerCase();
  }

  return isPlural ? translation.plural : translation.singular;
}
