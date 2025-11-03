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

type PreparedIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  yieldQuantity: number | null;
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

export function BatchProductionPageContent() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('selection');
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [productionQueue, setProductionQueue] = useState<ProductionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedProductions, setCompletedProductions] = useState<CompletedProduction[]>([]);
  const [loading, setLoading] = useState(false);

  // Load items (dishes and composite products) on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const [dishResult, productResult] = await Promise.all([
        import('@/lib/actions/dish.actions').then(m => m.getDishesAction({ isActive: true, includeRecipe: true })),
        import('@/lib/actions/product.actions').then(m => m.getCompositeProductsForProductionAction()),
      ]);

      const allItems: RecipeItem[] = [];

      // Add dishes with recipes
      if (dishResult.success && dishResult.data) {
        const dishesWithRecipes = dishResult.data.filter(
          (dish) => dish.recipeIngredients && dish.recipeIngredients.length > 0
        ) as Dish[];
        allItems.push(...dishesWithRecipes);
      }

      // Add composite products (already filtered for isComposite)
      if (productResult.success && productResult.data) {
        const compositeProducts = productResult.data.filter(
          (product: any) => product.compositeIngredients && product.compositeIngredients.length > 0
        ) as PreparedIngredient[];
        allItems.push(...compositeProducts);
      }

      setItems(allItems);
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

  const handleProcessCurrent = async (quantity: number, notes?: string, preparationIds?: string[], byproducts?: any[]) => {
    const current = productionQueue[currentIndex];
    if (!current) return;

    // If there are preparations to add, insert them before the current item
    if (preparationIds && preparationIds.length > 0) {
      const preparationsToInsert = preparationIds.map((prepId) => {
        const item = items.find((i) => i.id === prepId);
        return {
          dishId: prepId,
          dishName: item?.name || 'Unknown',
          quantity: 1,
        };
      });

      const updatedQueue = [
        ...productionQueue.slice(0, currentIndex),
        ...preparationsToInsert,
        { ...current, quantity, notes },
        ...productionQueue.slice(currentIndex + 1),
      ];

      setProductionQueue(updatedQueue);
      // Don't increment currentIndex since we're now processing the first prep
      return;
    }

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
        byproducts,
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

  const handleAddPreparationNow = async (preparationId: string) => {
    // Find the preparation item in loaded items
    let item = items.find((i) => i.id === preparationId);

    // If not found, try to fetch it dynamically
    if (!item) {
      try {
        const { getProductByIdAction } = await import('@/lib/actions/product.actions');
        const result = await getProductByIdAction(preparationId);

        if (result.success && result.data) {
          item = result.data as PreparedIngredient;
          // Add it to the items cache for future use
          setItems((prev) => [...prev, item as RecipeItem]);
        } else {
          console.error('Failed to fetch product:', result.error);
          return;
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        return;
      }
    }

    // Create the preparation item
    const preparationItem: ProductionItem = {
      dishId: preparationId,
      dishName: item.name,
      quantity: 1,
    };

    // Insert the preparation at the current index, pushing the current dish back
    const updatedQueue = [
      ...productionQueue.slice(0, currentIndex),
      preparationItem,
      ...productionQueue.slice(currentIndex),
    ];

    setProductionQueue(updatedQueue);
    // Current index stays the same, so we'll process the preparation next
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
    <div className="flex flex-col h-screen bg-background -mx-4 -mt-8 -mb-20">
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

          {phase === 'selection' && selectedItemIds.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <strong>{selectedItemIds.length}</strong> sélectionné{selectedItemIds.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Main content area - full height */}
      <div className="flex-1 overflow-hidden">
        {phase === 'selection' && (
          <ProductionSelectionPhase
            items={items}
            loading={loading}
            selectedItemIds={selectedItemIds}
            onSelectedItemIdsChange={setSelectedItemIds}
            onContinue={handleContinueFromSelection}
            onCancel={handleCancel}
          />
        )}

        {phase === 'step-by-step' && productionQueue[currentIndex] && (
          <ProductionStepPhase
            key={productionQueue[currentIndex].dishId}
            dishId={productionQueue[currentIndex].dishId}
            dishName={productionQueue[currentIndex].dishName}
            currentIndex={currentIndex}
            totalCount={productionQueue.length}
            onProcess={handleProcessCurrent}
            onSkip={handleSkipCurrent}
            onBack={currentIndex === 0 ? handleBackToSelection : handleBackStep}
            onAddPreparationNow={handleAddPreparationNow}
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
