'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Beaker, RefreshCw, Trash2, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/providers/LanguageProvider';
import { CreateButton } from '@/components/CreateButton';
import { PreparedQuickCreateFlow } from './PreparedQuickCreateFlow';
import { formatQuantity, translateUnit } from '@/lib/utils/unit-converter';

/**
 * Prepared Ingredients List
 * Displays composite products (prepared ingredients) with their recipes
 */

type CompositeIngredient = {
  id: string;
  baseProductId: string;
  quantity: number;
  unit: string;
  baseProduct: {
    id: string;
    name: string;
    unit: string;
  };
};

type CompositeProduct = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  yieldQuantity: number | null;
  category: string | null;
  compositeIngredients: CompositeIngredient[];
  calculatedUnitPrice?: number;
};

export function PreparedIngredientsList() {
  const router = useRouter();
  const { t } = useLanguage();
  const [compositeProducts, setCompositeProducts] = useState<CompositeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const loadCompositeProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/composite-products');
      if (response.ok) {
        const data = await response.json();
        setCompositeProducts(data);
      } else {
        toast.error(t('prepared.delete.error'));
      }
    } catch (error) {
      console.error('Error loading composite products:', error);
      toast.error(t('prepared.delete.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompositeProducts();
  }, []);

  const handleDeleteCompositeProduct = async (id: string, name: string) => {
    if (!confirm(t('prepared.delete.confirm'))) {
      return;
    }

    try {
      const response = await fetch(`/api/composite-products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('prepared.delete.success'));
        loadCompositeProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || t('prepared.delete.error'));
      }
    } catch (error) {
      console.error('Error deleting composite product:', error);
      toast.error(t('prepared.delete.error'));
    }
  };

  const toggleExpanded = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const handleCreatePrepared = () => {
    router.push('/menu/create-prepared');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-purple-500" />
              {t('prepared.title')}
            </CardTitle>
            <CardDescription>{t('prepared.subtitle')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowQuickCreate(true)}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              <Zap className="w-5 h-5" />
              Création rapide
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-gray-500">{t('today.quickSales.loading')}</div>
        ) : compositeProducts.length === 0 ? (
          <div className="py-12 text-center">
            <Beaker className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="mb-2 text-gray-500">{t('prepared.empty')}</p>
            <p className="mb-4 text-sm text-gray-400">{t('prepared.emptyHint')}</p>
            <CreateButton onClick={handleCreatePrepared}>{t('prepared.createFirst')}</CreateButton>
          </div>
        ) : (
          <div className="space-y-3">
            {compositeProducts.map((product) => {
              const isExpanded = expandedProducts.has(product.id);
              return (
                <div key={product.id} className="rounded-lg border">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex flex-1 items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleExpanded(product.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{product.name}</h3>
                          {product.category && (
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">{t('prepared.yield')}:</span>{' '}
                          {product.yieldQuantity} {translateUnit(product.unit, product.yieldQuantity)}
                          {' • '}
                          <span className="font-medium">{t('prepared.stock')}:</span>{' '}
                          {formatQuantity(product.quantity)} {translateUnit(product.unit, product.quantity)}
                          {' • '}
                          <span className="font-medium">{t('prepared.ingredients')}:</span>{' '}
                          {product.compositeIngredients.length}
                        </div>
                        {product.calculatedUnitPrice !== undefined && (
                          <div className="mt-1 text-sm text-gray-700">
                            <span className="font-medium">{t('prepared.calculatedPrice')}:</span>{' '}
                            {product.calculatedUnitPrice > 0 ? (
                              <span className="font-semibold text-green-600">
                                €{product.calculatedUnitPrice.toFixed(2)} / {translateUnit(product.unit, 1)}
                              </span>
                            ) : (
                              <span className="text-xs text-orange-500">
                                {t('prepared.missingIngredientPrices')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCompositeProduct(product.id, product.name)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Recipe Details */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 px-4 pb-4">
                      <div className="mt-3">
                        <h4 className="mb-2 text-sm font-medium text-gray-700">
                          {t('prepared.recipe')}:
                        </h4>
                        <div className="space-y-2">
                          {product.compositeIngredients.map((ingredient) => (
                            <div
                              key={ingredient.id}
                              className="flex items-center justify-between rounded border bg-white px-3 py-2"
                            >
                              <span className="text-sm">{ingredient.baseProduct.name}</span>
                              <Badge variant="outline" className="font-mono text-xs">
                                {ingredient.quantity} {ingredient.unit}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <PreparedQuickCreateFlow
        open={showQuickCreate}
        onOpenChange={(open) => {
          setShowQuickCreate(open);
          if (!open) {
            loadCompositeProducts();
          }
        }}
      />
    </Card>
  );
}
