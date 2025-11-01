'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChefHat,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UtensilsCrossed,
  Camera,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type FlowState = 'START' | 'BASICS' | 'PRICING' | 'SCANNING' | 'REVIEW' | 'COMPLETE';

type MenuData = {
  name: string;
  description: string;
  pricingType: 'PRIX_FIXE' | 'CHOICE';
  fixedPrice: string;
  numberOfCourses: string;
};

type MenuQuickCreateFlowProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MenuQuickCreateFlow({ open, onOpenChange }: MenuQuickCreateFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<FlowState>('START');
  const [menuData, setMenuData] = useState<MenuData>({
    name: '',
    description: '',
    pricingType: 'PRIX_FIXE',
    fixedPrice: '',
    numberOfCourses: '',
  });
  const [saving, setSaving] = useState(false);

  const celebrateWithConfetti = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleStartManual = () => {
    setState('BASICS');
  };

  const handleNextToPricing = () => {
    if (!menuData.name.trim()) {
      toast.error('Le nom du menu est requis');
      return;
    }
    setState('PRICING');
  };

  const handleNextToReview = () => {
    if (!menuData.fixedPrice) {
      toast.error('Le prix du menu est requis');
      return;
    }
    if (menuData.pricingType === 'CHOICE' && !menuData.numberOfCourses) {
      toast.error('Le nombre de plats est requis pour un menu au choix');
      return;
    }
    setState('REVIEW');
  };

  const handleSaveMenu = async () => {
    setSaving(true);
    try {
      const { createMenuAction } = await import('@/lib/actions/menu.actions');

      const result = await createMenuAction({
        name: menuData.name.trim(),
        description: menuData.description.trim() || undefined,
        isActive: true,
        pricingType: menuData.pricingType,
        fixedPrice: parseFloat(menuData.fixedPrice),
        minCourses: menuData.pricingType === 'CHOICE' ? parseInt(menuData.numberOfCourses) : undefined,
        maxCourses: menuData.pricingType === 'CHOICE' ? parseInt(menuData.numberOfCourses) : undefined,
      });

      if (result.success) {
        setState('COMPLETE');
        celebrateWithConfetti();
        toast.success('Menu créé avec succès!');

        setTimeout(() => {
          router.refresh();
          resetFlow();
          onOpenChange(false);
        }, 2000);
      } else {
        toast.error(result.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating menu:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const resetFlow = () => {
    setState('START');
    setMenuData({
      name: '',
      description: '',
      pricingType: 'PRIX_FIXE',
      fixedPrice: '',
      numberOfCourses: '',
    });
  };

  const handleBack = () => {
    if (state === 'PRICING') {
      setState('BASICS');
    } else if (state === 'REVIEW') {
      setState('PRICING');
    } else if (state === 'BASICS') {
      setState('START');
    }
  };

  const handleClose = () => {
    if (state !== 'START' && state !== 'COMPLETE' && menuData.name) {
      if (confirm('Vous avez des données non sauvegardées. Quitter quand même ?')) {
        resetFlow();
        onOpenChange(false);
      }
    } else {
      resetFlow();
      onOpenChange(false);
    }
  };

  const renderContent = () => {
    // START state
    if (state === 'START') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-6">
          <div className="text-center space-y-3">
            <UtensilsCrossed className="h-20 w-20 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">Créer un nouveau menu</h2>
            <p className="text-muted-foreground max-w-md">
              Créez rapidement un menu en scannant une carte ou en saisissant les informations manuellement.
            </p>
          </div>

          <div className="w-full max-w-md space-y-3">
            {/* Scan option */}
            <label htmlFor="scan-menu-file" className="block cursor-pointer">
              <div className="p-6 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">Scanner une carte de menu</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Prenez une photo ou importez une image de votre menu
                    </p>
                  </div>
                </div>
              </div>
              <input
                id="scan-menu-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // TODO: Handle menu scanning
                    toast.info('Scan de menu bientôt disponible!');
                  }
                }}
              />
            </label>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            {/* Manual option */}
            <Button
              onClick={handleStartManual}
              variant="outline"
              size="lg"
              className="w-full h-auto p-6"
            >
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Plus className="h-8 w-8 text-secondary" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">Saisie manuelle</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Entrez les informations du menu manuellement
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      );
    }

    // BASICS state
    if (state === 'BASICS') {
      return (
        <div className="flex flex-col h-full">
          {/* Progress */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <span className="font-medium">Informations de base</span>
              <span className="text-muted-foreground">→</span>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground">
                2
              </div>
              <span className="text-muted-foreground">Prix</span>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <UtensilsCrossed className="h-16 w-16 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">Informations du menu</h2>
                <p className="text-muted-foreground">Entrez le nom et la description</p>
              </div>

              {/* Menu Name */}
              <div className="space-y-3">
                <label className="text-lg font-semibold block">
                  Nom du menu <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Menu du Jour, Menu Dégustation..."
                  value={menuData.name}
                  onChange={(e) => setMenuData({ ...menuData, name: e.target.value })}
                  className="text-2xl h-16 font-medium"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-lg font-semibold block">
                  Description <span className="text-muted-foreground text-sm">(Optionnel)</span>
                </label>
                <Textarea
                  placeholder="Ex: Un menu complet avec entrée, plat et dessert"
                  value={menuData.description}
                  onChange={(e) => setMenuData({ ...menuData, description: e.target.value })}
                  className="text-lg min-h-24 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-muted/30">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                size="lg"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Retour
              </Button>
              <Button
                onClick={handleNextToPricing}
                disabled={!menuData.name.trim()}
                className="flex-2 bg-gradient-to-r from-primary to-secondary"
                size="lg"
              >
                Suivant: Prix
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // PRICING state
    if (state === 'PRICING') {
      return (
        <div className="flex flex-col h-full">
          {/* Progress */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-semibold">
                ✓
              </div>
              <span className="text-muted-foreground">Informations</span>
              <span className="text-muted-foreground">→</span>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <span className="font-medium">Prix</span>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <Sparkles className="h-16 w-16 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">Type et prix</h2>
                <p className="text-muted-foreground">Définissez le type de menu et son prix</p>
              </div>

              {/* Pricing Type */}
              <div className="space-y-4">
                <label className="text-lg font-semibold block">
                  Type de menu <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    type="button"
                    onClick={() => setMenuData({ ...menuData, pricingType: 'PRIX_FIXE' })}
                    className={`relative p-6 border-2 rounded-xl text-left transition-all ${
                      menuData.pricingType === 'PRIX_FIXE'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    {menuData.pricingType === 'PRIX_FIXE' && (
                      <div className="absolute top-4 right-4">
                        <Check className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="font-semibold text-xl">Prix fixe</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Un prix unique pour tous les plats du menu
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMenuData({ ...menuData, pricingType: 'CHOICE' })}
                    className={`relative p-6 border-2 rounded-xl text-left transition-all ${
                      menuData.pricingType === 'CHOICE'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    {menuData.pricingType === 'CHOICE' && (
                      <div className="absolute top-4 right-4">
                        <Check className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="font-semibold text-xl">Au choix</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Le client choisit X plats parmi les options
                    </p>
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-3">
                <label className="text-lg font-semibold block">
                  Prix du menu (€) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">€</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={menuData.fixedPrice}
                    onChange={(e) => setMenuData({ ...menuData, fixedPrice: e.target.value })}
                    className="text-2xl h-16 font-mono font-bold text-center pl-12"
                  />
                </div>
              </div>

              {/* Number of Courses (for CHOICE) */}
              {menuData.pricingType === 'CHOICE' && (
                <div className="space-y-3">
                  <label className="text-lg font-semibold block">
                    Nombre de plats <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={menuData.numberOfCourses}
                    onValueChange={(value) => setMenuData({ ...menuData, numberOfCourses: value })}
                  >
                    <SelectTrigger className="h-16 text-xl font-semibold">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2" className="text-lg">2 plats</SelectItem>
                      <SelectItem value="3" className="text-lg">3 plats</SelectItem>
                      <SelectItem value="4" className="text-lg">4 plats</SelectItem>
                      <SelectItem value="5" className="text-lg">5 plats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-muted/30">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                size="lg"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Retour
              </Button>
              <Button
                onClick={handleNextToReview}
                disabled={!menuData.fixedPrice || (menuData.pricingType === 'CHOICE' && !menuData.numberOfCourses)}
                className="flex-2 bg-gradient-to-r from-primary to-secondary"
                size="lg"
              >
                Vérifier
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // REVIEW state
    if (state === 'REVIEW') {
      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b bg-muted/30">
            <div className="text-center space-y-2">
              <Sparkles className="h-16 w-16 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Vérifier et créer</h2>
              <p className="text-muted-foreground">Vérifiez les informations avant de créer le menu</p>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="p-6 rounded-lg border-2 bg-card space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Nom du menu</div>
                  <div className="text-xl font-semibold">{menuData.name}</div>
                </div>
                {menuData.description && (
                  <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div>{menuData.description}</div>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="text-lg font-semibold">
                    {menuData.pricingType === 'PRIX_FIXE' ? 'Prix fixe' : 'Au choix'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Prix</div>
                  <div className="text-2xl font-bold text-primary">
                    €{parseFloat(menuData.fixedPrice).toFixed(2)}
                  </div>
                </div>
                {menuData.pricingType === 'CHOICE' && menuData.numberOfCourses && (
                  <div>
                    <div className="text-sm text-muted-foreground">Nombre de plats</div>
                    <div className="text-lg font-semibold">{menuData.numberOfCourses} plats</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-muted/30">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={saving}
                className="flex-1"
                size="lg"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Modifier
              </Button>
              <Button
                onClick={handleSaveMenu}
                disabled={saving}
                className="flex-2 bg-gradient-to-r from-primary to-secondary"
                size="lg"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Créer le menu
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // COMPLETE state
    if (state === 'COMPLETE') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-6">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 mx-auto rounded-full bg-success/10 flex items-center justify-center animate-bounce">
              <Check className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-3xl font-bold">Menu créé!</h2>
            <p className="text-muted-foreground max-w-md">
              <strong>{menuData.name}</strong> a été créé avec succès.
            </p>
          </div>

          <div className="w-full max-w-md p-6 rounded-lg border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Menu</span>
              <span className="font-semibold">{menuData.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prix</span>
              <span className="font-semibold">€{parseFloat(menuData.fixedPrice).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-semibold">
                {menuData.pricingType === 'PRIX_FIXE' ? 'Prix fixe' : 'Au choix'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl w-full h-[90vh] p-0 gap-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => {
          if (state !== 'START' && state !== 'COMPLETE' && menuData.name) {
            e.preventDefault();
          }
        }}
      >
        <VisuallyHidden>
          <DialogTitle>Créer un nouveau menu</DialogTitle>
        </VisuallyHidden>

        {/* Custom close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 rounded-full"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="h-full overflow-hidden">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
