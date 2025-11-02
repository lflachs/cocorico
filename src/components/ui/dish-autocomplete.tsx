'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Dish = {
  id: string;
  name: string;
};

type DishAutocompleteProps = {
  dishes: Dish[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function DishAutocomplete({
  dishes,
  value,
  onValueChange,
  placeholder = 'Rechercher un plat...',
  disabled = false,
  className,
}: DishAutocompleteProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const selectedDish = dishes.find((dish) => dish.id === value);

  const filteredDishes = React.useMemo(() => {
    if (!searchValue) return dishes;
    const search = searchValue.toLowerCase();
    return dishes.filter((dish) => dish.name.toLowerCase().includes(search));
  }, [dishes, searchValue]);

  const handleSelect = (dishId: string) => {
    onValueChange(dishId);
    setIsOpen(false);
    setSearchValue('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
    setSearchValue('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={disabled}
          className={cn(
            'w-full justify-between cursor-pointer hover:bg-accent',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedDish ? selectedDish.name : placeholder}
          <div className="flex items-center gap-1">
            {value && !disabled && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {dishes.length === 0
                ? 'Aucun plat avec recette disponible'
                : 'Aucun plat trouvé'}
            </CommandEmpty>
            <CommandGroup>
              {filteredDishes.map((dish) => (
                <CommandItem
                  key={dish.id}
                  value={dish.id}
                  onSelect={() => handleSelect(dish.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === dish.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {dish.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
