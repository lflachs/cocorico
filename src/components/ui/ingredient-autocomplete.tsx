'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Search, AlertCircle, Plus } from 'lucide-react';
import { searchIngredientSuggestions, getCategoryDisplayName } from '@/lib/utils/ingredients';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  name: string;
  displayName?: string;
  aliases?: string[];
};

type IngredientAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  existingProducts?: Product[];
  restrictToExisting?: boolean; // New prop to enforce existing products only
  onCreateNew?: () => void; // Callback when user wants to create new ingredient
};

export function IngredientAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Tapez pour rechercher...',
  disabled = false,
  className = '',
  existingProducts = [],
  restrictToExisting = false, // Default to false for backwards compatibility
  onCreateNew,
}: IngredientAutocompleteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get suggestions only when user is typing
  const suggestions = value.length > 0 ? searchIngredientSuggestions(value, 15) : [];

  // Helper function to check if a product matches the search query
  const productMatchesQuery = (product: Product, query: string): boolean => {
    const lowerQuery = query.toLowerCase();

    // Check displayName first (preferred)
    if (product.displayName && product.displayName.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Check full name
    if (product.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Check aliases
    if (product.aliases && product.aliases.some(alias => alias.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    return false;
  };

  // Filter out existing products from suggestions
  const existingProductNames = new Set(existingProducts.map(p => p.name.toLowerCase()));
  const filteredSuggestions = suggestions.filter(
    s => !existingProductNames.has(s.name.toLowerCase())
  );

  // Show matching existing products (search by displayName, name, or aliases)
  const matchingProducts = existingProducts.filter(p => productMatchesQuery(p, value));

  // If restrictToExisting is true, only show existing products
  const displaySuggestions = restrictToExisting ? [] : filteredSuggestions;
  const hasResults = matchingProducts.length > 0 || displaySuggestions.length > 0;
  const totalResults = matchingProducts.length + displaySuggestions.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setIsOpen(newValue.length > 0);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    onSelect?.(selectedValue);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !hasResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalResults);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalResults) % totalResults);
        break;
      case 'Enter':
        e.preventDefault();
        const allItems = [...matchingProducts.map(p => p.name), ...filteredSuggestions.map(s => s.name)];
        if (allItems[highlightedIndex]) {
          handleSelect(allItems[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => value.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-9 cursor-text ${className}`}
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {isOpen && value.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="max-h-[300px] overflow-y-auto p-1">
            {!hasResults ? (
              <div className="px-4 py-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="p-2 bg-orange-50 rounded-full">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Ingrédient non trouvé</p>
                  <p className="text-xs text-muted-foreground">
                    {restrictToExisting
                      ? "Cet ingrédient n'existe pas dans votre stock."
                      : "Aucun résultat trouvé"}
                  </p>
                </div>
                {/* Show create button if callback provided */}
                {onCreateNew ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      onCreateNew();
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer "{value}"
                  </Button>
                ) : restrictToExisting ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/stock')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter au stock d'abord
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                {/* Existing Products */}
                {matchingProducts.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Vos produits
                    </div>
                    {matchingProducts.map((product, idx) => {
                      const displayText = product.displayName || product.name;
                      const isUsingDisplayName = !!product.displayName;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelect(displayText)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm cursor-pointer transition-colors ${
                            idx === highlightedIndex
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/50'
                          }`}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-medium">{displayText}</span>
                            {isUsingDisplayName && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {product.name}
                              </span>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 shrink-0">
                            Existant
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Suggestions - Only shown if not restricted to existing */}
                {displaySuggestions.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Suggestions
                    </div>
                    {displaySuggestions.map((suggestion, idx) => {
                      const globalIndex = matchingProducts.length + idx;
                      return (
                        <button
                          key={`${suggestion.category}-${idx}`}
                          type="button"
                          onClick={() => handleSelect(suggestion.name)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm cursor-pointer transition-colors ${
                            globalIndex === highlightedIndex
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/50'
                          }`}
                          onMouseEnter={() => setHighlightedIndex(globalIndex)}
                        >
                          <span>{suggestion.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryDisplayName(suggestion.category)}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
