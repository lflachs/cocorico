'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RecipeCategory } from '@prisma/client';

type RecipeCategoryWithChildren = RecipeCategory & {
  children?: RecipeCategory[];
};

type RecipeCategorySelectProps = {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  categoryType: 'DISH' | 'PREPARED_INGREDIENT';
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function RecipeCategorySelect({
  value,
  onChange,
  categoryType,
  label,
  placeholder = 'Sélectionnez un chapitre',
  disabled = false,
  className,
}: RecipeCategorySelectProps) {
  const [categories, setCategories] = useState<RecipeCategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, [categoryType]);

  const loadCategories = async () => {
    try {
      const { getRecipeCategoriesAction } = await import(
        '@/lib/actions/recipe-category.actions'
      );
      const result = await getRecipeCategoriesAction(categoryType);

      if (result.success && result.data) {
        setCategories(result.data as RecipeCategoryWithChildren[]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Flatten categories including children
  const flattenedCategories: RecipeCategory[] = [];
  categories.forEach((cat) => {
    flattenedCategories.push(cat);
    if (cat.children) {
      cat.children.forEach((child) => {
        flattenedCategories.push(child);
      });
    }
  });

  return (
    <div className={className}>
      {label && <Label className="text-base font-semibold mb-3 block">{label}</Label>}
      <Select
        value={value || 'none'}
        onValueChange={(val) => onChange(val === 'none' ? undefined : val)}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? 'Chargement...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Aucun chapitre</SelectItem>
          {categories.map((category) => (
            <div key={category.id}>
              <SelectItem value={category.id}>
                <div className="flex items-center gap-2">
                  {category.icon && <span>{category.icon}</span>}
                  <span className="font-medium">{category.name}</span>
                </div>
              </SelectItem>
              {category.children?.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  <div className="flex items-center gap-2 pl-4">
                    {child.icon && <span>{child.icon}</span>}
                    <span>{child.name}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
