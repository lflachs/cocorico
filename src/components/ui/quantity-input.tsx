'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

/**
 * Quantity Input Component
 * Large centered number input with +/- buttons for fast adjustment
 * Matches the reception flow design
 */

type QuantityInputProps = {
  value: number;
  onChange: (value: number) => void;
  step?: number; // Step for manual input (e.g., 0.01 for decimals)
  buttonStep?: number; // Step for +/- buttons (defaults to 1)
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export function QuantityInput({
  value,
  onChange,
  step = 0.01,
  buttonStep = 1, // Default to 1 for +/- buttons
  min = 0,
  max,
  disabled = false,
  className = '',
  label = 'Quantité',
}: QuantityInputProps) {
  const handleIncrement = () => {
    const newValue = value + buttonStep;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - buttonStep;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    if (newValue >= min && (max === undefined || newValue <= max)) {
      onChange(newValue);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-16 w-16 rounded-full shrink-0"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
        >
          <Minus className="h-6 w-6" />
        </Button>
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className="text-center text-4xl font-bold h-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-16 w-16 rounded-full shrink-0"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
