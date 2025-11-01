/**
 * Format a number to remove floating point precision errors
 * and strip unnecessary trailing zeros
 */
export function formatQuantity(value: number, decimals: number = 1): string {
  // Round to specified decimals to avoid floating point errors
  const rounded = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

  // Convert to string with fixed decimals
  const fixed = rounded.toFixed(decimals);

  // Remove trailing zeros and decimal point if not needed
  return fixed.replace(/\.?0+$/, '');
}

/**
 * Format a quantity with its unit
 */
export function formatQuantityWithUnit(value: number, unit: string, decimals: number = 1): string {
  return `${formatQuantity(value, decimals)} ${unit}`;
}
