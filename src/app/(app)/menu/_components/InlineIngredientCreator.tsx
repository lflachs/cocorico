'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { QuantityInput } from '@/components/ui/quantity-input';
import { UnitSelector } from '@/components/ui/unit-selector';

/**
 * Inline Ingredient Creator
 * Creates a new ingredient/product without redirecting
 * Provides a clean, fast UX for creating products while building dishes
 */

type InlineIngredientCreatorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialQuantity?: string;
  initialUnit?: string;
  onSuccess: (product: { id: string; name: string; unit: string; unitPrice: number }) => void;
};

export function InlineIngredientCreator({
  open,
  onOpenChange,
  initialName = '',
  initialQuantity = '',
  initialUnit = 'KG',
  onSuccess,
}: InlineIngredientCreatorProps) {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: initialName,
    unit: initialUnit,
    unitPrice: '',
    initialQuantity: parseFloat(initialQuantity) || 0,
  });

  // Update initial values when dialog opens
  useState(() => {
    if (open) {
      setFormData({
        name: initialName,
        unit: initialUnit,
        unitPrice: '',
        initialQuantity: parseFloat(initialQuantity) || 0,
      });
    }
  });

  const handleCreate = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Le nom de l\'ingrédient est requis');
      return;
    }

    if (!formData.unitPrice || parseFloat(formData.unitPrice) < 0) {
      toast.error('Le prix unitaire est requis');
      return;
    }

    setCreating(true);
    try {
      // Create product via API
      const productFormData = new FormData();
      productFormData.append('name', formData.name.trim());
      productFormData.append('quantity', formData.initialQuantity.toString());
      productFormData.append('unit', formData.unit);
      productFormData.append('unitPrice', formData.unitPrice);
      productFormData.append('trackable', 'true');

      const { createProductWithoutRedirectAction } = await import('@/lib/actions/product.actions');
      const result = await createProductWithoutRedirectAction(productFormData);

      if (result.success && result.data) {
        toast.success(`✓ Ingrédient "${formData.name}" créé`);
        onSuccess({
          id: result.data.id,
          name: result.data.name,
          unit: result.data.unit,
          unitPrice: parseFloat(formData.unitPrice),
        });
        onOpenChange(false);

        // Reset form
        setFormData({
          name: '',
          unit: 'KG',
          unitPrice: '',
          initialQuantity: '0',
        });
      } else {
        toast.error(result.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating ingredient:', error);
      toast.error('Erreur lors de la création de l\'ingrédient');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFormData({
      name: '',
      unit: 'KG',
      unitPrice: '',
      initialQuantity: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Créer un nouvel ingrédient
          </DialogTitle>
          <DialogDescription>
            Ajoutez cet ingrédient à votre inventaire
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tip */}
          <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <strong>Astuce:</strong> L'ingrédient sera ajouté à votre inventaire et pourra être utilisé dans d'autres plats.
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="ingredient-name">
              Nom de l'ingrédient <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ingredient-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Tomates, Poulet, Huile d'olive..."
              className="mt-1"
            />
          </div>

          {/* Unit Selector - Reusable component */}
          <UnitSelector
            value={formData.unit}
            onChange={(value) => setFormData({ ...formData, unit: value })}
            label="Unité de mesure *"
          />

          {/* Unit Price */}
          <div>
            <Label htmlFor="ingredient-price">
              Prix unitaire (€/{formData.unit}) <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              <Input
                id="ingredient-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="0.00"
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Prix d'achat par {formData.unit}
            </p>
          </div>

          {/* Initial Quantity - Reusable component */}
          <QuantityInput
            value={formData.initialQuantity}
            onChange={(value) => setFormData({ ...formData, initialQuantity: value })}
            label="Quantité initiale (optionnel)"
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={creating || !formData.name.trim() || !formData.unitPrice}
            >
              {creating ? 'Création...' : 'Créer l\'ingrédient'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
