'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductionSelectionPhase } from './ProductionSelectionPhase';
import { ProductionStepPhase } from './ProductionStepPhase';
import { ProductionSummaryPhase } from './ProductionSummaryPhase';

type Dish = {
  id: string;
  name: string;
  description?: string | null;
  sellingPrice?: number | null;
  isActive: boolean;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  recipeIngredients?: {
    id: string;
    quantityRequired: number;
    unit: string;
    product: {
      id: string;
      name: string;
      unitPrice?: number | null;
    };
  }[];
};

type PreparedIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  yieldQuantity: number | null;
  category: string | null;
  categoryId?: string | null;
  compositeIngredients: {
    id: string;
    baseProductId: string;
    quantity: number;
    unit: string;
    baseProduct: {
      id: string;
      name: string;
      unit: string;
      unitPrice?: number | null;
    };
  }[];
  calculatedUnitPrice?: number;
};

type RecipeItem = Dish | PreparedIngredient;

type ProductionItem = {
  dishId: string;
  dishName: string;
  quantity: number;
  notes?: string;
};

type CompletedProduction = {
  dishId: string;
  dishName: string;
  quantity: number;
  success: boolean;
  error?: string;
};

type Phase = 'selection' | 'step-by-step' | 'summary';

type BatchProductionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BatchProductionDialog({ open, onOpenChange }: BatchProductionDialogProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('selection');
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [productionQueue, setProductionQueue] = useState<ProductionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedProductions, setCompletedProductions] = useState<CompletedProduction[]>([]);
  const [loading, setLoading] = useState(false);

  // Load items when dialog opens
  useEffect(() => {
    if (open) {
      loadItems();
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPhase('selection');
      setSelectedItemIds([]);
      setProductionQueue([]);
      setCurrentIndex(0);
      setCompletedProductions([]);
    }
  }, [open]);

  const loadItems = async () => {
    setLoading(true);
    try {
      // Load dishes
      const { getDishesAction } = await import('@/lib/actions/dish.actions');
      const dishResult = await getDishesAction({ isActive: true, includeRecipe: true });
      const dishesWithRecipes = dishResult.success && dishResult.data
        ? (dishResult.data.filter(
            (dish) => dish.recipeIngredients && dish.recipeIngredients.length > 0
          ) as Dish[])
        : [];

      // Load prepared ingredients
      const preparedResponse = await fetch('/api/composite-products');
      const preparedIngredients: PreparedIngredient[] = preparedResponse.ok
        ? await preparedResponse.json()
        : [];

      // Filter prepared ingredients that have composite ingredients
      const preparedWithRecipes = preparedIngredients.filter(
        (prep) => prep.compositeIngredients && prep.compositeIngredients.length > 0
      );

      // Combine both types
      setItems([...dishesWithRecipes, ...preparedWithRecipes]);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueFromSelection = (selectedIds: string[]) => {
    // Create production queue from selected items
    const queue = selectedIds.map((itemId) => {
      const item = items.find((i) => i.id === itemId);
      return {
        dishId: itemId,
        dishName: item?.name || 'Unknown',
        quantity: 1, // Default quantity
      };
    });
    setProductionQueue(queue);
    setCurrentIndex(0);
    setPhase('step-by-step');
  };

  const handleBackToSelection = () => {
    setPhase('selection');
    setCurrentIndex(0);
  };

  const handleProcessCurrent = async (quantity: number, notes?: string) => {
    const current = productionQueue[currentIndex];
    if (!current) return;

    // Update the quantity in the queue
    const updatedQueue = [...productionQueue];
    updatedQueue[currentIndex] = { ...current, quantity, notes };
    setProductionQueue(updatedQueue);

    // Process the production
    try {
      const { createProductionAction } = await import('@/lib/actions/production.actions');
      const result = await createProductionAction({
        dishId: current.dishId,
        quantity,
        notes,
      });

      const completed: CompletedProduction = {
        dishId: current.dishId,
        dishName: current.dishName,
        quantity,
        success: result.success,
        error: result.error,
      };

      setCompletedProductions((prev) => [...prev, completed]);

      // Move to next or summary
      if (currentIndex < productionQueue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setPhase('summary');
        router.refresh(); // Refresh to update inventory
      }
    } catch (error) {
      console.error('Error processing production:', error);
      setCompletedProductions((prev) => [
        ...prev,
        {
          dishId: current.dishId,
          dishName: current.dishName,
          quantity,
          success: false,
          error: 'Erreur lors de la production',
        },
      ]);
    }
  };

  const handleSkipCurrent = () => {
    if (currentIndex < productionQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setPhase('summary');
      router.refresh();
    }
  };

  const handleBackStep = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = () => {
    onOpenChange(false);
  };

  const getDialogTitle = () => {
    switch (phase) {
      case 'selection':
        return 'Sélectionner les préparations';
      case 'step-by-step':
        return `Production (${currentIndex + 1}/${productionQueue.length})`;
      case 'summary':
        return 'Résumé de production';
      default:
        return 'Production';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl">{getDialogTitle()}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {phase === 'selection' && (
            <ProductionSelectionPhase
              items={items}
              loading={loading}
              selectedItemIds={selectedItemIds}
              onSelectedItemIdsChange={setSelectedItemIds}
              onContinue={handleContinueFromSelection}
              onCancel={() => onOpenChange(false)}
            />
          )}

          {phase === 'step-by-step' && productionQueue[currentIndex] && (
            <ProductionStepPhase
              dishId={productionQueue[currentIndex].dishId}
              dishName={productionQueue[currentIndex].dishName}
              currentIndex={currentIndex}
              totalCount={productionQueue.length}
              onProcess={handleProcessCurrent}
              onSkip={handleSkipCurrent}
              onBack={currentIndex === 0 ? handleBackToSelection : handleBackStep}
            />
          )}

          {phase === 'summary' && (
            <ProductionSummaryPhase
              completedProductions={completedProductions}
              onFinish={handleFinish}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
