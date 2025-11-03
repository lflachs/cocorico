"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getRecipeCategoriesAction } from "@/lib/actions/recipe-category.actions";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  children?: Category[];
};

type CategorySelectorProps = {
  value?: string | null;
  onChange: (categoryId: string | null) => void;
  label?: string;
  placeholder?: string;
  categoryType?: 'DISH' | 'PREPARED_INGREDIENT' | 'INVENTORY';
};

export function CategorySelector({
  value,
  onChange,
  label = "Catégorie",
  placeholder = "Sélectionner une catégorie",
  categoryType = 'INVENTORY',
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      try {
        const result = await getRecipeCategoriesAction(categoryType);
        if (result.success && result.data) {
          setCategories(result.data as Category[]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [categoryType]);

  const flattenCategories = (cats: Category[], level = 0): Array<Category & { level: number }> => {
    const result: Array<Category & { level: number }> = [];
    for (const cat of cats) {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, level + 1));
      }
    }
    return result;
  };

  const flatCategories = flattenCategories(categories);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Select
        value={value || undefined}
        onValueChange={(val) => onChange(val || null)}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Chargement..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Aucune catégorie</SelectItem>
          {flatCategories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <span style={{ marginLeft: `${category.level * 12}px` }}>
                  {category.icon || '📦'} {category.name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
