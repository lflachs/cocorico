'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, Camera, Trash2, Minus, Plus, AlertTriangle, Link as LinkIcon, Search, Sparkles, ArrowRightLeft } from 'lucide-react';
import { normalizeProductName } from '@/lib/utils/product-name-sanitizer';
import { convertToInventoryUnit, getConversionDescription } from '@/lib/utils/unit-converter';

type ExtractedProduct = {
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
};

type ProductConfirmCardProps = {
  product: ExtractedProduct;
  index: number;
  total: number;
  onConfirm: (product: ExtractedProduct) => void;
  onCaptureDLC: () => void;
  onDispute: () => void;
  onRemove: () => void;
  onSkip: () => void;
};

/**
 * ProductConfirmCard - Full-screen card for confirming one product
 *
 * Big buttons, easy editing, optional DLC capture
 * Designed for touch interaction at receiving dock
 */
type MatchedProduct = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
};

export function ProductConfirmCard({
  product,
  index,
  total,
  onConfirm,
  onCaptureDLC,
  onDispute,
  onRemove,
  onSkip,
}: ProductConfirmCardProps) {
  const [rawName] = useState(product.name); // Keep original for reference
  const [originalUnit] = useState(product.unit); // Keep original unit for conversion tracking
  const [editedProduct, setEditedProduct] = useState(() => {
    // Normalize the product name on initial load
    const normalized = normalizeProductName(product.name);
    return {
      ...product,
      name: normalized.suggested,
      unit: normalized.unit || product.unit,
    };
  });
  const [matchedProducts, setMatchedProducts] = useState<MatchedProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(true);
  const [hasAppliedInventoryMatch, setHasAppliedInventoryMatch] = useState(false);
  const [conversionInfo, setConversionInfo] = useState<{
    original: { quantity: number; unit: string };
    converted: { quantity: number; unit: string };
  } | null>(null);

  // Check if name was cleaned/suggested
  const normalized = normalizeProductName(rawName);
  const wasCleaned = normalized.sanitized !== rawName;
  const wasSuggested = normalized.suggested !== normalized.sanitized;

  // Search for matching products when name changes
  useEffect(() => {
    const searchMatches = async () => {
      if (!editedProduct.name || editedProduct.name.length < 2) {
        setMatchedProducts([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(editedProduct.name)}`);
        if (response.ok) {
          const data = await response.json();
          setMatchedProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchMatches, 300);
    return () => clearTimeout(debounce);
  }, [editedProduct.name]);

  // Auto-update name and unit to match inventory product when found
  useEffect(() => {
    if (matchedProducts.length > 0 && !hasAppliedInventoryMatch && !isSearching) {
      const bestMatch = matchedProducts[0];

      console.log('🔍 Unit matching debug:', {
        currentProductUnit: editedProduct.unit,
        inventoryUnit: bestMatch.unit,
        currentQuantity: editedProduct.quantity,
        hasAppliedInventoryMatch,
      });

      const conversion = convertToInventoryUnit(
        editedProduct.quantity,
        editedProduct.unit,
        bestMatch.unit
      );

      console.log('🔄 Conversion result:', conversion);

      // Store conversion info only if units were actually converted
      if (conversion.wasConverted) {
        // Units were compatible and converted
        setConversionInfo({
          original: { quantity: editedProduct.quantity, unit: editedProduct.unit },
          converted: { quantity: conversion.quantity, unit: conversion.unit },
        });
      } else {
        // No conversion or incompatible - don't show any info
        setConversionInfo(null);
      }

      // Update product with inventory name and unit
      const updated = {
        ...editedProduct,
        name: bestMatch.name,
        unit: conversion.unit,
        quantity: conversion.quantity,
      };

      console.log('✅ Updating to:', updated);

      setEditedProduct(updated);
      setHasAppliedInventoryMatch(true);
      setShowSuggestion(false);
    }
  }, [matchedProducts.length, hasAppliedInventoryMatch, isSearching]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(0, editedProduct.quantity + delta);
    const newTotalPrice = editedProduct.unitPrice
      ? editedProduct.unitPrice * newQuantity
      : editedProduct.totalPrice;

    setEditedProduct({
      ...editedProduct,
      quantity: newQuantity,
      totalPrice: newTotalPrice,
    });
  };

  const handleConfirm = () => {
    // Validate that unit is selected
    if (!editedProduct.unit || editedProduct.unit.trim() === '') {
      toast.error('Unité requise', {
        description: 'Veuillez sélectionner une unité avant de confirmer',
      });
      return;
    }

    // Validate that quantity is positive
    if (editedProduct.quantity <= 0) {
      toast.error('Quantité invalide', {
        description: 'La quantité doit être supérieure à 0',
      });
      return;
    }

    onConfirm(editedProduct);
  };

  const bestMatch = matchedProducts.length > 0 ? matchedProducts[0] : null;
  const canConfirm = editedProduct.unit && editedProduct.unit.trim() !== '' && editedProduct.quantity > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Progress indicator */}
      <div className="p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Produit {index + 1} sur {total}
          </span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            {Math.round(((index + 1) / total) * 100)}%
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card content */}
      <Card className="flex-1 m-4 border-2 shadow-lg">
        <CardHeader className="pb-4">
          <div className="space-y-3">
            {/* Product name - editable */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Produit
              </label>
              <Input
                value={editedProduct.name}
                onChange={(e) => {
                  setEditedProduct({ ...editedProduct, name: e.target.value });
                  setShowSuggestion(false); // Hide suggestion when user manually edits
                }}
                className="text-2xl font-bold h-14 mt-1"
                placeholder="Nom du produit"
              />
            </div>

            {/* Show if name was auto-cleaned/suggested */}
            {showSuggestion && (wasCleaned || wasSuggested) && (
              <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-purple-900">
                      {wasSuggested ? 'Nom suggéré' : 'Nom nettoyé'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-purple-700 hover:text-purple-900"
                      onClick={() => {
                        setEditedProduct({ ...editedProduct, name: rawName });
                        setShowSuggestion(false);
                      }}
                    >
                      Restaurer original
                    </Button>
                  </div>
                  <p className="text-xs text-purple-700 mt-1">
                    Original: <span className="font-mono">{rawName}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Product matching indicator */}
            {isSearching && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Search className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-sm text-blue-700">Recherche de correspondances...</span>
              </div>
            )}

            {!isSearching && bestMatch && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <LinkIcon className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-900">Correspondance trouvée</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        Stock: {bestMatch.quantity} {bestMatch.unit}
                      </Badge>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Sera ajouté à: <span className="font-medium">{bestMatch.name}</span>
                    </p>
                  </div>
                </div>

                {/* Show conversion info if units were converted or are incompatible */}
                {conversionInfo && (
                  <div className={`flex items-start gap-2 p-2 rounded-lg border ${
                    conversionInfo.original.unit !== conversionInfo.converted.unit &&
                    conversionInfo.original.quantity === conversionInfo.converted.quantity
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <ArrowRightLeft className={`w-4 h-4 shrink-0 mt-0.5 ${
                      conversionInfo.original.unit !== conversionInfo.converted.unit &&
                      conversionInfo.original.quantity === conversionInfo.converted.quantity
                        ? 'text-orange-600'
                        : 'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      {conversionInfo.original.unit !== conversionInfo.converted.unit &&
                       conversionInfo.original.quantity === conversionInfo.converted.quantity ? (
                        <>
                          <p className="text-xs font-semibold text-orange-900">
                            Unités incompatibles
                          </p>
                          <p className="text-xs text-orange-700 mt-0.5">
                            OCR: {conversionInfo.original.quantity} {conversionInfo.original.unit} → Inventaire: {conversionInfo.converted.unit}. Vérifiez la quantité.
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-blue-700">
                          Conversion automatique: {conversionInfo.original.quantity} {conversionInfo.original.unit} → {conversionInfo.converted.quantity.toFixed(2)} {conversionInfo.converted.unit}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isSearching && !bestMatch && editedProduct.name.length >= 2 && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-orange-900">Aucune correspondance</span>
                  <p className="text-xs text-orange-700 mt-1">
                    Un nouveau produit sera créé dans l'inventaire
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quantity with big +/- buttons and editable input */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quantité
            </label>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="lg"
                className="h-16 w-16 rounded-full shrink-0"
                onClick={() => handleQuantityChange(-1)}
              >
                <Minus className="h-6 w-6" />
              </Button>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editedProduct.quantity}
                onChange={(e) => {
                  const newQuantity = parseFloat(e.target.value) || 0;
                  const newTotalPrice = editedProduct.unitPrice
                    ? editedProduct.unitPrice * newQuantity
                    : editedProduct.totalPrice;
                  setEditedProduct({
                    ...editedProduct,
                    quantity: newQuantity,
                    totalPrice: newTotalPrice,
                  });
                }}
                className="text-center text-4xl font-bold h-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="outline"
                size="lg"
                className="h-16 w-16 rounded-full shrink-0"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Unit selector - Button style */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Unité
              </label>
              {bestMatch && (
                <span className="text-xs text-green-600 font-medium">
                  🔒 Unité de l'inventaire
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 'KG', label: 'KG' },
                { value: 'G', label: 'G' },
                { value: 'L', label: 'L' },
                { value: 'ML', label: 'ML' },
                { value: 'PC', label: 'PC' },
              ].map((unit) => (
                <Button
                  key={unit.value}
                  type="button"
                  variant={editedProduct.unit === unit.value ? 'default' : 'outline'}
                  disabled={bestMatch !== null}
                  className={`h-12 font-semibold ${
                    editedProduct.unit === unit.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setEditedProduct({ ...editedProduct, unit: unit.value })}
                >
                  {unit.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {[
                { value: 'BOX', label: 'Boîte' },
                { value: 'BAG', label: 'Sac' },
                { value: 'BUNCH', label: 'Botte' },
                { value: 'PACK', label: 'Pack' },
                { value: 'UNIT', label: 'Unité' },
              ].map((unit) => (
                <Button
                  key={unit.value}
                  type="button"
                  variant={editedProduct.unit === unit.value ? 'default' : 'outline'}
                  size="sm"
                  disabled={bestMatch !== null}
                  className={`h-10 text-xs font-medium ${
                    editedProduct.unit === unit.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setEditedProduct({ ...editedProduct, unit: unit.value })}
                >
                  {unit.label}
                </Button>
              ))}
            </div>
            {bestMatch && (
              <p className="text-xs text-muted-foreground mt-2">
                L'unité est verrouillée pour correspondre à votre inventaire
              </p>
            )}
          </div>

          {/* Prices */}
          {editedProduct.unitPrice && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Prix unitaire
                </label>
                <div className="text-xl font-semibold mt-1">
                  {editedProduct.unitPrice.toFixed(2)} €
                </div>
              </div>
              {editedProduct.totalPrice && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Prix total
                  </label>
                  <div className="text-xl font-semibold mt-1">
                    {editedProduct.totalPrice.toFixed(2)} €
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-6">
          {/* Main confirm button */}
          <Button
            onClick={handleConfirm}
            size="lg"
            disabled={!canConfirm}
            className="w-full h-16 text-lg font-semibold"
          >
            <Check className="mr-2 h-6 w-6" />
            Confirmer
          </Button>
          {!canConfirm && (
            <p className="text-xs text-center text-orange-600">
              {!editedProduct.unit || editedProduct.unit.trim() === ''
                ? 'Veuillez sélectionner une unité'
                : 'La quantité doit être supérieure à 0'}
            </p>
          )}

          {/* Important secondary actions - DLC and Dispute */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              onClick={onCaptureDLC}
              variant="outline"
              size="lg"
              className="h-16 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300 font-semibold"
            >
              <Camera className="mr-2 h-5 w-5" />
              Ajouter DLC
            </Button>
            <Button
              onClick={onDispute}
              variant="outline"
              size="lg"
              className="h-16 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300 font-semibold"
            >
              <AlertTriangle className="mr-2 h-5 w-5" />
              Signaler Litige
            </Button>
          </div>

          {/* Tertiary actions */}
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
