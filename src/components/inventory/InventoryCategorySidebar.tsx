"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { InventoryCategoryManagementDialog } from "./InventoryCategoryManagementDialog";

export interface InventoryCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  order: number;
  parentId?: string | null;
  categoryType: string;
  isPredefined: boolean;
  children?: InventoryCategory[];
  _count?: {
    products?: number;
  };
}

interface InventoryCategorySidebarProps {
  categories: InventoryCategory[];
  selectedCategoryId?: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onManageCategories?: () => void;
  showManageButton?: boolean;
}

export function InventoryCategorySidebar({
  categories,
  selectedCategoryId,
  onCategorySelect,
  onManageCategories,
  showManageButton = true,
}: InventoryCategorySidebarProps) {
  // Track which parent categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );
  const [managementDialogOpen, setManagementDialogOpen] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Calculate total count across all categories
  const totalCount = categories.reduce((sum, cat) => {
    const count = cat._count?.products ?? 0;
    const childrenCount =
      cat.children?.reduce(
        (childSum, child) => childSum + (child._count?.products ?? 0),
        0
      ) ?? 0;
    return sum + count + childrenCount;
  }, 0);

  // Render individual category item
  const renderCategoryItem = (
    category: InventoryCategory,
    level: number = 0
  ) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;

    const itemCount = category._count?.products ?? 0;

    const content = (
      <button
        onClick={() => onCategorySelect(category.id)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all",
          "hover:bg-accent/50",
          isSelected && "bg-accent text-accent-foreground font-medium",
          !isSelected && "text-muted-foreground hover:text-foreground"
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {/* Icon */}
        <span className="text-base flex-shrink-0">
          {category.icon || "📦"}
        </span>

        {/* Name */}
        <span className="flex-1 text-left truncate">{category.name}</span>

        {/* Count badge */}
        {itemCount > 0 && (
          <span
            className={cn(
              "px-2 py-0.5 text-xs rounded-full flex-shrink-0",
              isSelected
                ? "bg-background/50 text-foreground"
                : "bg-muted text-muted-foreground"
            )}
            style={
              category.color && !isSelected
                ? {
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                  }
                : undefined
            }
          >
            {itemCount}
          </span>
        )}
      </button>
    );

    if (hasChildren) {
      return (
        <Collapsible
          key={category.id}
          open={isExpanded}
          onOpenChange={() => toggleCategory(category.id)}
        >
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-transparent"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            {content}
          </div>
          <CollapsibleContent className="space-y-1 pt-1">
            {category.children?.map((child) =>
              renderCategoryItem(child, level + 1)
            )}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return <div key={category.id}>{content}</div>;
  };

  return (
    <div className="flex flex-col h-full border-r bg-muted/20">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            Catégories
          </h2>
          {showManageButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setManagementDialogOpen(true)}
              className="h-7 w-7 p-0"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* "All items" button */}
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all",
            "hover:bg-accent/50",
            selectedCategoryId === null &&
              "bg-accent text-accent-foreground font-medium",
            selectedCategoryId !== null &&
              "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="text-base">📦</span>
          <span className="flex-1 text-left">Tous les produits</span>
          <span
            className={cn(
              "px-2 py-0.5 text-xs rounded-full",
              selectedCategoryId === null
                ? "bg-background/50 text-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {totalCount}
          </span>
        </button>
      </div>

      {/* Categories list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {categories.map((category) => renderCategoryItem(category, 0))}

          {/* Add custom category button */}
          {showManageButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setManagementDialogOpen(true)}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle catégorie</span>
            </Button>
          )}
        </div>
      </ScrollArea>

      {/* Category Management Dialog */}
      <InventoryCategoryManagementDialog
        open={managementDialogOpen}
        onClose={() => setManagementDialogOpen(false)}
        categories={categories}
        onRefresh={() => {
          setManagementDialogOpen(false);
          onManageCategories?.();
        }}
      />
    </div>
  );
}
