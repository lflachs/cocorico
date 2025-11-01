'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, Minus, Plus, Trash2, UtensilsCrossed, Search, AlertCircle } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type ExtractedDish = {
  name: string;
  quantity: number;
  price?: number;
  dishId?: string; // Added to store the matched dish ID
};

type DishOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type DishConfirmCardProps = {
  dish: ExtractedDish;
  index: number;
  total: number;
  onConfirm: (dish: ExtractedDish) => void;
  onRemove: () => void;
  onSkip: () => void;
};

/**
 * DishConfirmCard - Full-screen card for confirming one dish from receipt
 *
 * Big buttons, easy editing, shows dish info
 * Designed for touch interaction similar to reception flow
 */
export function DishConfirmCard({
  dish,
  index,
  total,
  onConfirm,
  onRemove,
  onSkip,
}: DishConfirmCardProps) {
  const [editedDish, setEditedDish] = useState(dish);
  const [availableDishes, setAvailableDishes] = useState<DishOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [matchedDish, setMatchedDish] = useState<DishOption | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  // Load available dishes from database
  useEffect(() => {
    loadDishes();
  }, []);

  // Update editedDish when dish prop changes (navigating between dishes)
  useEffect(() => {
    setEditedDish(dish);
    // Try to auto-match when dish changes
    if (availableDishes.length > 0) {
      autoMatchDish(dish.name);
    }
  }, [dish, availableDishes]);

  const loadDishes = async () => {
    setLoading(true);
    try {
      const { getDishesAction } = await import('@/lib/actions/dish.actions');
      const result = await getDishesAction({ isActive: true });

      if (result.success && result.data) {
        setAvailableDishes(result.data);
        // Auto-match on first load
        autoMatchDish(dish.name, result.data);
      }
    } catch (error) {
      console.error('Error loading dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-match dish name using fuzzy matching
  const autoMatchDish = (dishName: string, dishes: DishOption[] = availableDishes) => {
    if (!dishName || dishes.length === 0) return;

    const normalized = dishName.toLowerCase().trim();

    // Try exact match first
    let match = dishes.find(d => d.name.toLowerCase() === normalized);

    if (!match) {
      // Try partial match (contains)
      match = dishes.find(d =>
        d.name.toLowerCase().includes(normalized) ||
        normalized.includes(d.name.toLowerCase())
      );
    }

    if (!match) {
      // Try fuzzy match (similar words)
      const words = normalized.split(/\s+/);
      match = dishes.find(d => {
        const dishWords = d.name.toLowerCase().split(/\s+/);
        return words.some(w => dishWords.some(dw => dw.includes(w) || w.includes(dw)));
      });
    }

    if (match) {
      setMatchedDish(match);
      setEditedDish(prev => ({ ...prev, name: match.name, dishId: match.id }));
      setShowWarning(false);
    } else {
      setMatchedDish(null);
      setShowWarning(true); // Show warning for unmatched dish
    }
  };

  const handleQuantityChange = (delta: number) => {
    setEditedDish({
      ...editedDish,
      quantity: Math.max(1, editedDish.quantity + delta),
    });
  };

  const handleConfirm = () => {
    onConfirm(editedDish);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress indicator */}
      <div className="p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Plat {index + 1} sur {total}
          </span>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            {Math.round(((index + 1) / total) * 100)}%
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card content */}
      <Card className="flex-1 m-4 border-2 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-3">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Plat vendu
            </span>
          </div>
          <div className="space-y-3">
            {/* Dish name - searchable select */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Nom du plat
              </label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between text-2xl font-bold h-14 mt-1"
                  >
                    <span className={matchedDish ? "text-foreground" : "text-muted-foreground"}>
                      {editedDish.name || "Sélectionner un plat..."}
                    </span>
                    <Search className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un plat..." />
                    <CommandList>
                      <CommandEmpty>Aucun plat trouvé.</CommandEmpty>
                      <CommandGroup>
                        {availableDishes.map((dish) => (
                          <CommandItem
                            key={dish.id}
                            value={dish.name}
                            onSelect={() => {
                              setEditedDish({ ...editedDish, name: dish.name, dishId: dish.id });
                              setMatchedDish(dish);
                              setShowWarning(false);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                matchedDish?.id === dish.id ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                            {dish.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Match status indicator */}
              {matchedDish && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Plat trouvé: {matchedDish.name}</span>
                </div>
              )}

              {/* Warning for unmatched dishes */}
              {showWarning && !matchedDish && (
                <div className="mt-2 flex items-start gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Plat non trouvé en base</p>
                    <p className="text-xs mt-1">
                      Sélectionnez un plat existant ou créez-le dans le menu avant d'enregistrer cette vente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quantity with big +/- buttons */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quantité vendue
            </label>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={() => handleQuantityChange(-1)}
              >
                <Minus className="h-6 w-6" />
              </Button>
              <div className="flex-1 text-center">
                <div className="text-4xl font-bold">{editedDish.quantity}</div>
                <div className="text-sm text-muted-foreground">vendu{editedDish.quantity > 1 ? 's' : ''}</div>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Price if available */}
          {editedDish.price != null && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Prix total
              </label>
              <div className="text-xl font-semibold mt-1">
                {typeof editedDish.price === 'number'
                  ? editedDish.price.toFixed(2)
                  : parseFloat(String(editedDish.price)).toFixed(2)} €
              </div>
            </div>
          )}

          {/* Info message */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-900">
              <strong>💡 Info:</strong> Le stock sera automatiquement déduit selon la recette de ce plat.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-6">
          {/* Main confirm button */}
          <Button
            onClick={handleConfirm}
            size="lg"
            disabled={!matchedDish}
            className="w-full h-16 text-lg font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!matchedDish ? "Veuillez sélectionner un plat existant" : ""}
          >
            <Check className="mr-2 h-6 w-6" />
            {matchedDish ? 'Confirmer' : 'Sélectionner un plat d\'abord'}
          </Button>

          {/* Secondary actions */}
          <div className="flex gap-2 w-full">
            <Button
              onClick={onSkip}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Passer
            </Button>
            <Button
              onClick={onRemove}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Retirer
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
