"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { InventoryCategory } from "./InventoryCategorySidebar";

interface InventoryCategoryManagementDialogProps {
  open: boolean;
  onClose: () => void;
  categories: InventoryCategory[];
  onRefresh: () => void;
}

const PRESET_COLORS = [
  "#228B22", "#DAA520", "#3CB371", "#8B4513", "#F0E68C", "#D2B48C",
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#22c55e",
];

const PRESET_ICONS = [
  "🌿", "🧂", "🥬", "🥩", "🥛", "📦", "🥫", "🥗", "🍲", "🐟",
  "🍰", "🍯", "🥖", "🔪", "🍳", "🧄", "🫒", "🧅",
];

export function InventoryCategoryManagementDialog({
  open,
  onClose,
  categories,
  onRefresh,
}: InventoryCategoryManagementDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState(PRESET_ICONS[0]);
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Veuillez entrer un nom de catégorie");
      return;
    }

    try {
      const { createRecipeCategoryAction } = await import("@/lib/actions/recipe-category.actions");
      const result = await createRecipeCategoryAction({
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
        categoryType: "INVENTORY",
      });

      if (result.success) {
        toast.success("Catégorie créée avec succès");
        setNewCategoryName("");
        setNewCategoryIcon(PRESET_ICONS[0]);
        setNewCategoryColor(PRESET_COLORS[0]);
        setIsCreating(false);
        onRefresh();
      } else {
        toast.error(result.error || "Échec de la création de la catégorie");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Échec de la création de la catégorie");
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string, isPredefined: boolean) => {
    if (isPredefined) {
      toast.error("Impossible de supprimer une catégorie prédéfinie");
      return;
    }

    if (!confirm(`Supprimer la catégorie "${categoryName}" ?`)) {
      return;
    }

    try {
      const { deleteRecipeCategoryAction } = await import("@/lib/actions/recipe-category.actions");
      const result = await deleteRecipeCategoryAction(categoryId);

      if (result.success) {
        toast.success("Catégorie supprimée avec succès");
        onRefresh();
      } else {
        toast.error(result.error || "Échec de la suppression");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Échec de la suppression de la catégorie");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Gérer les catégories d'inventaire</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Existing categories */}
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <span className="text-2xl">{category.icon || "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{category.name}</span>
                      {category.isPredefined && (
                        <Badge variant="secondary" className="text-xs">Par défaut</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {category._count?.products || 0} produit(s)
                    </span>
                  </div>
                  {!category.isPredefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id, category.name, category.isPredefined)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Create new category section */}
            {!isCreating ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
            ) : (
              <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
                <div>
                  <Label htmlFor="category-name">Nom de la catégorie *</Label>
                  <Input
                    id="category-name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Épices, Fruits, etc."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Icône</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PRESET_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewCategoryIcon(icon)}
                        className={cn(
                          "text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110",
                          newCategoryIcon === icon
                            ? "border-primary bg-primary/10"
                            : "border-transparent hover:border-primary/50"
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Couleur</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCategoryColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                          newCategoryColor === color
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-transparent hover:border-primary/50"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1"
                  >
                    Créer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setNewCategoryName("");
                      setNewCategoryIcon(PRESET_ICONS[0]);
                      setNewCategoryColor(PRESET_COLORS[0]);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
