'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, Check, ChefHat } from 'lucide-react';
import { DishAutocomplete } from '@/components/ui/dish-autocomplete';
import { toast } from 'sonner';

type Dish = {
  id: string;
  name: string;
  isActive: boolean;
};

type DailyMenuDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * DailyMenuDialog - Simple modal to select today's menu du jour
 *
 * Allows chef to quickly select:
 * - Appetizer (Entrée)
 * - Main Course (Plat)
 * - Dessert
 */
export function DailyMenuDialog({ open, onOpenChange }: DailyMenuDialogProps) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedAppetizer, setSelectedAppetizer] = useState<string>('');
  const [selectedMain, setSelectedMain] = useState<string>('');
  const [selectedDessert, setSelectedDessert] = useState<string>('');

  // Load available dishes and today's daily menu
  useEffect(() => {
    if (open) {
      loadDishes();
      loadTodaysDailyMenu();
    }
  }, [open]);

  const loadDishes = async () => {
    setLoading(true);
    try {
      const { getDishesAction } = await import('@/lib/actions/dish.actions');
      const result = await getDishesAction({ isActive: true });

      if (result.success && result.data) {
        setDishes(result.data);
      }
    } catch (error) {
      console.error('Error loading dishes:', error);
      toast.error('Erreur lors du chargement des plats');
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysDailyMenu = async () => {
    try {
      const { getTodayDailyMenuAction } = await import('@/lib/actions/menu.actions');
      const result = await getTodayDailyMenuAction();

      if (result.success && result.data) {
        // Extract dishes from sections
        const sections = result.data.sections || [];

        // Assume sections are: Appetizers (0), Main Course (1), Dessert (2)
        if (sections[0]?.dishes?.[0]?.dish?.id) {
          setSelectedAppetizer(sections[0].dishes[0].dish.id);
        }
        if (sections[1]?.dishes?.[0]?.dish?.id) {
          setSelectedMain(sections[1].dishes[0].dish.id);
        }
        if (sections[2]?.dishes?.[0]?.dish?.id) {
          setSelectedDessert(sections[2].dishes[0].dish.id);
        }
      }
    } catch (error) {
      console.error('Error loading today\'s daily menu:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedAppetizer || !selectedMain || !selectedDessert) {
      toast.error('Veuillez sélectionner un plat pour chaque catégorie');
      return;
    }

    setSaving(true);
    try {
      const { setTodayDailyMenuAction } = await import('@/lib/actions/menu.actions');

      const result = await setTodayDailyMenuAction({
        appetizerId: selectedAppetizer,
        mainId: selectedMain,
        dessertId: selectedDessert,
      });

      if (result.success) {
        toast.success('Menu du jour mis à jour avec succès!');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error saving daily menu:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <DialogTitle className="text-2xl">Menu du jour</DialogTitle>
          </div>
          <p className="text-muted-foreground">
            Sélectionnez les plats pour le menu du jour d'aujourd'hui
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Appetizer */}
          <div className="space-y-3">
            <label className="text-lg font-semibold block">
              Entrée <span className="text-destructive">*</span>
            </label>
            <DishAutocomplete
              dishes={dishes}
              value={selectedAppetizer}
              onValueChange={setSelectedAppetizer}
              placeholder="Sélectionner une entrée..."
              disabled={loading || saving}
            />
          </div>

          {/* Main Course */}
          <div className="space-y-3">
            <label className="text-lg font-semibold block">
              Plat principal <span className="text-destructive">*</span>
            </label>
            <DishAutocomplete
              dishes={dishes}
              value={selectedMain}
              onValueChange={setSelectedMain}
              placeholder="Sélectionner un plat..."
              disabled={loading || saving}
            />
          </div>

          {/* Dessert */}
          <div className="space-y-3">
            <label className="text-lg font-semibold block">
              Dessert <span className="text-destructive">*</span>
            </label>
            <DishAutocomplete
              dishes={dishes}
              value={selectedDessert}
              onValueChange={setSelectedDessert}
              placeholder="Sélectionner un dessert..."
              disabled={loading || saving}
            />
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Info:</strong> Ce menu sera reconnu lors du scan des tickets avec "menu du jour"
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedAppetizer || !selectedMain || !selectedDessert}
            className="flex-1"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
