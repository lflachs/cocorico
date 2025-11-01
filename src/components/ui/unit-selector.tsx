'use client';

import { Button } from '@/components/ui/button';

/**
 * Unit Selector Component
 * Button-based unit selection in two rows (common units + packaging)
 * Matches the reception flow design
 */

type UnitOption = {
  value: string;
  label: string;
};

type UnitSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  locked?: boolean;
  className?: string;
  label?: string;
  lockMessage?: string;
};

const COMMON_UNITS: UnitOption[] = [
  { value: 'KG', label: 'KG' },
  { value: 'G', label: 'G' },
  { value: 'L', label: 'L' },
  { value: 'ML', label: 'ML' },
  { value: 'PC', label: 'PC' },
];

const PACKAGING_UNITS: UnitOption[] = [
  { value: 'BOX', label: 'Boîte' },
  { value: 'BAG', label: 'Sac' },
  { value: 'BUNCH', label: 'Botte' },
  { value: 'PACK', label: 'Pack' },
  { value: 'UNIT', label: 'Unité' },
];

export function UnitSelector({
  value,
  onChange,
  disabled = false,
  locked = false,
  className = '',
  label = 'Unité',
  lockMessage,
}: UnitSelectorProps) {
  const isDisabled = disabled || locked;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        {label && (
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </label>
        )}
        {locked && (
          <span className="text-xs text-green-600 font-medium">
            🔒 {lockMessage || 'Unité verrouillée'}
          </span>
        )}
      </div>

      {/* Common units - First row */}
      <div className="grid grid-cols-5 gap-2">
        {COMMON_UNITS.map((unit) => (
          <Button
            key={unit.value}
            type="button"
            variant={value === unit.value ? 'default' : 'outline'}
            disabled={isDisabled}
            className={`h-12 font-semibold ${
              value === unit.value
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => onChange(unit.value)}
          >
            {unit.label}
          </Button>
        ))}
      </div>

      {/* Packaging units - Second row */}
      <div className="grid grid-cols-5 gap-2 mt-2">
        {PACKAGING_UNITS.map((unit) => (
          <Button
            key={unit.value}
            type="button"
            variant={value === unit.value ? 'default' : 'outline'}
            size="sm"
            disabled={isDisabled}
            className={`h-10 text-xs font-medium ${
              value === unit.value
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => onChange(unit.value)}
          >
            {unit.label}
          </Button>
        ))}
      </div>

      {locked && (
        <p className="text-xs text-muted-foreground mt-2">
          {lockMessage || "L'unité est verrouillée pour correspondre à votre inventaire"}
        </p>
      )}
    </div>
  );
}

// Export unit lists for use in other components
export { COMMON_UNITS, PACKAGING_UNITS };
