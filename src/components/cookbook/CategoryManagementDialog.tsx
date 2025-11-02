"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, GripVertical, Check, X } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CategoryType } from "./RecipeCategorySidebar";

interface RecipeCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  order: number;
  parentId?: string | null;
  categoryType: CategoryType;
  isPredefined: boolean;
  children?: RecipeCategory[];
}

interface CategoryManagementDialogProps {
  open: boolean;
  onClose: () => void;
  categoryType: CategoryType;
  categories: RecipeCategory[];
  onRefresh: () => void;
}

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
];

const PRESET_ICONS = [
  "📚", "📖", "📝", "🥫", "🥗", "🍲", "🐟", "🥩",
  "🍰", "🧂", "🌿", "🥛", "🍯", "🥖", "🔪", "🍳",
];

export function CategoryManagementDialog({
  open,
  onClose,
  categoryType,
  categories,
  onRefresh,
}: CategoryManagementDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Veuillez entrer un nom de chapitre");
      return;
    }

    try {
      const { createRecipeCategoryAction } = await import("@/lib/actions/recipe-category.actions");
      const result = await createRecipeCategoryAction({
        name: newCategoryName.trim(),
        icon: newCategoryIcon || undefined,
        color: newCategoryColor,
        categoryType: categoryType,
      });

      if (result.success) {
        toast.success("Chapitre créé avec succès");
        setNewCategoryName("");
        setNewCategoryIcon("");
        setNewCategoryColor(PRESET_COLORS[0]);
        setIsCreating(false);
        onRefresh();
      } else {
        toast.error(result.error || "Échec de la création du chapitre");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Échec de la création du chapitre");
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string, isPredefined: boolean) => {
    if (isPredefined) {
      toast.error("Impossible de supprimer un chapitre prédéfini");
      return;
    }

    if (!confirm(`Supprimer le chapitre "${categoryName}" ?`)) {
      return;
    }

    try {
      const { deleteRecipeCategoryAction } = await import("@/lib/actions/recipe-category.actions");
      const result = await deleteRecipeCategoryAction(categoryId);

      if (result.success) {
        toast.success("Chapitre supprimé avec succès");
        onRefresh();
      } else {
        toast.error(result.error || "Échec de la suppression du chapitre");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Échec de la suppression du chapitre");
    }
  };

  const renderCategoryItem = (category: RecipeCategory, level: number = 0) => {
    const isEditing = editingId === category.id;

    return (
      <div key={category.id} className="space-y-1">
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors",
            level > 0 && "ml-6"
          )}
        >
          {/* Drag handle */}
          <div className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100">
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Icon */}
          <span className="text-lg flex-shrink-0">{category.icon || "📄"}</span>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <span className={cn("truncate", category.isPredefined && "text-muted-foreground")}>
              {category.name}
            </span>
            {category.isPredefined && (
              <span className="ml-2 text-xs text-muted-foreground">(système)</span>
            )}
          </div>

          {/* Color indicator */}
          {category.color && (
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
          )}

          {/* Actions */}
          {!category.isPredefined && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setEditingId(category.id)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => handleDeleteCategory(category.id, category.name, category.isPredefined)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Render children */}
        {category.children?.map((child) => renderCategoryItem(child, level + 1))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Gérer les {categoryType === "DISH" ? "chapitres" : "catégories"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new category form */}
          {isCreating ? (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Nom du chapitre</Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Sauces, Desserts..."
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Icône</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewCategoryIcon(icon)}
                      className={cn(
                        "w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all",
                        newCategoryIcon === icon
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      className={cn(
                        "w-10 h-10 rounded-lg border-2 transition-all",
                        newCategoryColor === color
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateCategory} size="sm" className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Créer
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false);
                    setNewCategoryName("");
                    setNewCategoryIcon("");
                    setNewCategoryColor(PRESET_COLORS[0]);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsCreating(true)} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau chapitre personnalisé
            </Button>
          )}

          {/* List of categories */}
          <ScrollArea className="h-[400px] border rounded-lg p-2">
            <div className="space-y-1">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun chapitre créé
                </div>
              ) : (
                categories.map((category) => renderCategoryItem(category, 0))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
