'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductionSelectionPhase } from './ProductionSelectionPhase';
import { ProductionStepPhase } from './ProductionStepPhase';
import { ProductionSummaryPhase } from './ProductionSummaryPhase';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft } from 'lucide-react';

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

export function BatchProductionPageContent() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('selection');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
  const [productionQueue, setProductionQueue] = useState<ProductionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedProductions, setCompletedProductions] = useState<CompletedProduction[]>([]);
  const [loading, setLoading] = useState(false);

  // Load dishes on mount
  useEffect(() => {
    loadDishes();
  }, []);

  const loadDishes = async () => {
    setLoading(true);
    try {
      const { getDishesAction } = await import('@/lib/actions/dish.actions');
      const result = await getDishesAction({ isActive: true, includeRecipe: true });
      if (result.success && result.data) {
        // Filter dishes that have recipes
        const dishesWithRecipes = result.data.filter(
          (dish) => dish.recipeIngredients && dish.recipeIngredients.length > 0
        ) as Dish[];
        setDishes(dishesWithRecipes);
      }
    } catch (error) {
      console.error('Error loading dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueFromSelection = (selectedIds: string[]) => {
    // Create production queue from selected dishes
    const queue = selectedIds.map((dishId) => {
      const dish = dishes.find((d) => d.id === dishId);
      return {
        dishId,
        dishName: dish?.name || 'Unknown',
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
    router.push('/prep');
  };

  const handleCancel = () => {
    router.push('/prep');
  };

  const getPageTitle = () => {
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{getPageTitle()}</h1>
              {phase === 'step-by-step' && (
                <p className="text-sm text-muted-foreground">
                  {productionQueue[currentIndex]?.dishName}
                </p>
              )}
            </div>
          </div>

          {phase === 'selection' && selectedDishIds.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <strong>{selectedDishIds.length}</strong> sélectionné{selectedDishIds.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Main content area - full height */}
      <div className="flex-1 overflow-hidden">
        {phase === 'selection' && (
          <ProductionSelectionPhase
            items={dishes}
            loading={loading}
            selectedItemIds={selectedDishIds}
            onSelectedItemIdsChange={setSelectedDishIds}
            onContinue={handleContinueFromSelection}
            onCancel={handleCancel}
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
    </div>
  );
}
