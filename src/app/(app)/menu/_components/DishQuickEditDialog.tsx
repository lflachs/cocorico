"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Package } from "lucide-react";
import { IngredientAutocomplete } from "@/components/ui/ingredient-autocomplete";

interface Ingredient {
  id?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
}

interface DishQuickEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishId: string;
  dishName: string;
  dishDescription?: string | null;
  dishSellingPrice?: number | null;
}

const UNITS = [
  { value: 'KG', label: 'kg' },
  { value: 'G', label: 'g' },
  { value: 'L', label: 'L' },
  { value: 'ML', label: 'mL' },
  { value: 'CL', label: 'cL' },
  { value: 'PC', label: 'pièce(s)' },
  { value: 'BUNCH', label: 'botte' },
  { value: 'CLOVE', label: 'gousse' },
];

export function DishQuickEditDialog({
  open,
  onOpenChange,
  dishId,
  dishName,
  dishDescription,
  dishSellingPrice,
}: DishQuickEditDialogProps) {
  const [name, setName] = useState(dishName);
  const [description, setDescription] = useState(dishDescription || "");
  const [sellingPrice, setSellingPrice] = useState(
    dishSellingPrice?.toString() || ""
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingProducts, setExistingProducts] = useState<Array<{
    id: string;
    name: string;
    displayName?: string;
    unit: string;
  }>>([]);

  // Load dish ingredients and products when dialog opens
  useEffect(() => {
    if (open) {
      setName(dishName);
      setDescription(dishDescription || "");
      setSellingPrice(dishSellingPrice?.toString() || "");
      loadIngredients();
      loadExistingProducts();
    }
  }, [open, dishId, dishName, dishDescription, dishSellingPrice]);

  const loadExistingProducts = async () => {
    try {
      const response = await fetch('/api/products?trackable=true');
      if (response.ok) {
        const products = await response.json();
        setExistingProducts(products.map((p: any) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          unit: p.unit,
        })));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const { getDishByIdAction } = await import("@/lib/actions/dish.actions");
      const result = await getDishByIdAction(dishId);

      if (result.success && result.data) {
        const dish = result.data as any;
        if (dish.recipeIngredients) {
          setIngredients(
            dish.recipeIngredients.map((ing: any) => ({
              id: ing.id,
              productId: ing.productId,
              productName: ing.product?.name || "",
              quantity: ing.quantityRequired,
              unit: ing.unit,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error loading ingredients:", error);
      toast.error("Échec du chargement des ingrédients");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { productName: "", quantity: 0, unit: "KG" },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: any
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Le nom du plat est requis");
      return;
    }

    // Validate ingredients
    const invalidIngredient = ingredients.find(
      (ing) => !ing.productId || !ing.productName || ing.quantity <= 0
    );
    if (invalidIngredient) {
      if (!invalidIngredient.productId && invalidIngredient.productName) {
        toast.error(
          `L'ingrédient "${invalidIngredient.productName}" n'existe pas dans votre stock. Veuillez l'ajouter d'abord.`
        );
      } else if (!invalidIngredient.productName) {
        toast.error("Tous les ingrédients doivent avoir un nom");
      } else {
        toast.error("Tous les ingrédients doivent avoir une quantité valide");
      }
      return;
    }

    setSaving(true);

    try {
      const { updateDishAction } = await import("@/lib/actions/dish.actions");

      const result = await updateDishAction(dishId, {
        name: name.trim(),
        description: description.trim() || undefined,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : undefined,
        recipeIngredients: ingredients.map((ing) => ({
          productId: ing.productId!,
          quantityRequired: ing.quantity,
          unit: ing.unit,
        })),
      });

      if (result.success) {
        toast.success("Recette modifiée avec succès");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Échec de la modification");
      }
    } catch (error) {
      console.error("Error updating dish:", error);
      toast.error("Échec de la modification");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Modifier la recette</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du plat *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tartare de boeuf"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le plat..."
              rows={3}
            />
          </div>

          {/* Selling Price */}
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Prix de vente (€)</Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="25.00"
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label>Ingrédients</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[300px] rounded-md border p-3">
                <div className="space-y-3">
                  {ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30"
                    >
                      {/* Ingredient Name */}
                      <div className="space-y-1">
                        <Label className="text-xs">Ingrédient</Label>
                        <IngredientAutocomplete
                          value={ingredient.productName}
                          onChange={(value) => {
                            handleIngredientChange(index, "productName", value);
                            // Try to find matching product
                            const matchingProduct = existingProducts.find(
                              (p) =>
                                p.name.toLowerCase() === value.toLowerCase() ||
                                p.displayName?.toLowerCase() === value.toLowerCase()
                            );
                            if (matchingProduct) {
                              handleIngredientChange(index, "productId", matchingProduct.id);
                              handleIngredientChange(index, "unit", matchingProduct.unit);
                            } else {
                              // Clear productId if no match
                              handleIngredientChange(index, "productId", undefined);
                            }
                          }}
                          existingProducts={existingProducts}
                          placeholder="Nom de l'ingrédient"
                        />
                      </div>

                      {/* Quantity and Unit */}
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Quantité</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={ingredient.quantity}
                            onChange={(e) =>
                              handleIngredientChange(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Unité</Label>
                          <select
                            value={ingredient.unit}
                            onChange={(e) =>
                              handleIngredientChange(index, "unit", e.target.value)
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {UNITS.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveIngredient(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {ingredients.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun ingrédient. Ajoutez-en un ci-dessous.
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Add Ingredient Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddIngredient}
              className="w-full"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un ingrédient
            </Button>
          </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
