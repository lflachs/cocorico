'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertCircle, Check, ChevronsUpDown } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { SUPPORTED_UNITS, UNIT_LABELS } from '@/lib/constants/units';
import { cn } from '@/lib/utils';

/**
 * Product Mapping Row
 * Single product with mapping selector and editable fields
 */

type ExtractedProduct = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  mappedProductId?: string;
};

type InventoryProduct = {
  id: string;
  name: string;
  unit: string;
};

type ProductMappingRowProps = {
  product: ExtractedProduct;
  onMapping: (mappedProductId: string | undefined) => void;
  onProductUpdate: (productId: string, updates: Partial<ExtractedProduct>) => void;
};

export function ProductMappingRow({ product, onMapping, onProductUpdate }: ProductMappingRowProps) {
  const { t } = useLanguage();
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Local state for editable fields
  const [editedName, setEditedName] = useState(product.name);
  const [editedQuantity, setEditedQuantity] = useState(product.quantity);
  const [editedUnit, setEditedUnit] = useState(product.unit.toUpperCase());
  const [editedUnitPrice, setEditedUnitPrice] = useState(product.unitPrice);

  useEffect(() => {
    loadInventoryProducts();
  }, []);

  // Update total when quantity or unit price changes
  useEffect(() => {
    const newTotal = editedQuantity * editedUnitPrice;
    if (newTotal !== product.totalPrice) {
      onProductUpdate(product.id, {
        name: editedName,
        quantity: editedQuantity,
        unit: editedUnit,
        unitPrice: editedUnitPrice,
        totalPrice: newTotal,
      });
    }
  }, [editedQuantity, editedUnitPrice, editedName, editedUnit]);

  const loadInventoryProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setInventoryProducts(data);
    } catch (error) {
      console.error('Error loading inventory products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (value: string) => {
    if (value === '__none__') {
      onMapping(undefined);
    } else {
      onMapping(value);
    }
  };

  const handleUnitChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setEditedUnit(upperValue);
  };

  const hasValidUnit = SUPPORTED_UNITS.includes(editedUnit as any);
  const calculatedTotal = editedQuantity * editedUnitPrice;

  // Find selected product
  const selectedProduct = product.mappedProductId
    ? inventoryProducts.find((p) => p.id === product.mappedProductId)
    : null;

  // Filter products based on search
  const filteredProducts = inventoryProducts.filter((p) =>
    p.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelectProduct = (productId: string | null) => {
    onMapping(productId || undefined);
    setOpen(false);
    setSearchValue('');
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-colors ${
        !hasValidUnit
          ? 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="space-y-4">
        {/* Invalid unit warning */}
        {!hasValidUnit && (
          <Badge variant="destructive" className="bg-red-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t('bills.confirm.invalidUnit')}
          </Badge>
        )}

        {/* Product Combobox */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            {t('bills.confirm.productName')}
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between bg-white"
              >
                <span className="truncate">
                  {selectedProduct ? (
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {selectedProduct.name}
                      <span className="text-xs text-gray-500">({selectedProduct.unit})</span>
                    </span>
                  ) : (
                    <span className="text-gray-500">{editedName || 'Select or create product...'}</span>
                  )}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search products..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandEmpty>
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">No product found</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditedName(searchValue || editedName);
                        handleSelectProduct(null);
                      }}
                      className="w-full"
                    >
                      Create "{searchValue || editedName}" as new product
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {!selectedProduct && (
                    <CommandItem
                      value="__create_new__"
                      onSelect={() => {
                        setEditedName(searchValue || editedName);
                        handleSelectProduct(null);
                      }}
                      className="text-blue-600"
                    >
                      <span className="font-medium">+ Create "{searchValue || editedName}" as new product</span>
                    </CommandItem>
                  )}
                  {filteredProducts.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => {
                        setEditedName(p.name);
                        setEditedUnit(p.unit);
                        handleSelectProduct(p.id);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          product.mappedProductId === p.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex-1">{p.name}</span>
                      <span className="text-xs text-gray-500">({p.unit})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedProduct ? (
            <p className="text-xs text-green-600">Mapped to existing product</p>
          ) : (
            <p className="text-xs text-blue-600">Will create new product: "{editedName}"</p>
          )}
        </div>

        {/* Editable Fields */}
        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t('bills.confirm.quantity')}
            </label>
            <Input
              type="number"
              step="0.01"
              value={editedQuantity}
              onChange={(e) => setEditedQuantity(parseFloat(e.target.value) || 0)}
              className="bg-white"
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t('bills.confirm.unit')}
            </label>
            <Select value={editedUnit} onValueChange={handleUnitChange}>
              <SelectTrigger className={`bg-white ${!hasValidUnit ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={t('bills.confirm.unit')} />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit} - {UNIT_LABELS[unit]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!hasValidUnit && (
              <p className="text-xs text-red-600 mt-1">{t('bills.confirm.unitMustBe')}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t('bills.confirm.unitPrice')} (€)
            </label>
            <Input
              type="number"
              step="0.01"
              value={editedUnitPrice}
              onChange={(e) => setEditedUnitPrice(parseFloat(e.target.value) || 0)}
              className="bg-white"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t('bills.confirm.totalPrice')} (€)
            </label>
            <Input
              type="number"
              value={calculatedTotal.toFixed(2)}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
