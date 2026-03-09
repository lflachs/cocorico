'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  ChevronRight,
  ChevronLeft,
  PackageCheck,
  ChefHat,
  ShoppingCart,
  Receipt,
  ClipboardCheck,
  TrendingUp,
  BarChart3,
  Trash2,
  Home,
  type LucideIcon,
} from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const tourSteps: TourStep[] = [
  {
    title: 'Bienvenue sur Cocorico !',
    description:
      "Cocorico t'aide à gérer ton stock, tes commandes et tes recettes au quotidien. On te fait un petit tour ?",
    icon: Home,
    color: 'bg-blue-500',
  },
  {
    title: 'Réception des livraisons',
    description:
      'Scanne tes bons de livraison pour enregistrer automatiquement les produits reçus et mettre à jour ton stock.',
    icon: PackageCheck,
    color: 'bg-green-500',
  },
  {
    title: 'Production & Préparation',
    description:
      'Consulte ce qu\'il faut produire aujourd\'hui et enregistre tes préparations pour déduire automatiquement les ingrédients du stock.',
    icon: ChefHat,
    color: 'bg-orange-500',
  },
  {
    title: 'Commandes fournisseurs',
    description:
      'Génère tes commandes de réassort en un clic basé sur tes niveaux de stock et tes seuils d\'alerte.',
    icon: ShoppingCart,
    color: 'bg-purple-500',
  },
  {
    title: 'Ventes & Tickets de caisse',
    description:
      'Enregistre tes ventes pour déduire automatiquement les ingrédients des plats vendus de ton stock.',
    icon: Receipt,
    color: 'bg-pink-500',
  },
  {
    title: 'Inventaire',
    description:
      'Fais ton inventaire physique et compare avec le stock théorique. Identifie les écarts et ajuste.',
    icon: ClipboardCheck,
    color: 'bg-teal-500',
  },
  {
    title: 'Dates de péremption (DLC)',
    description:
      'Suis les dates de péremption de tes produits pour éviter le gaspillage et les pertes.',
    icon: Trash2,
    color: 'bg-red-500',
  },
  {
    title: 'Food Cost & Rentabilité',
    description:
      'Visualise ton food cost par plat et par période. Optimise ta marge en identifiant les plats les plus rentables.',
    icon: TrendingUp,
    color: 'bg-amber-500',
  },
  {
    title: 'Statistiques & Tendances',
    description:
      'Analyse tes données de stock, ventes et achats pour prendre de meilleures décisions.',
    icon: BarChart3,
    color: 'bg-indigo-500',
  },
];

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const shouldShow = localStorage.getItem('cocorico-show-tour');
    if (shouldShow === 'true') {
      setIsVisible(true);
      localStorage.removeItem('cocorico-show-tour');
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setCurrentStep(0);
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-card shadow-2xl border overflow-hidden">
        {/* Header with icon */}
        <div className={`${step.color} p-8 flex justify-center`}>
          <div className="rounded-full bg-white/20 p-4">
            <Icon className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold">{step.title}</h2>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground -mt-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pt-2">
            {tourSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>

            <span className="text-xs text-muted-foreground">
              {currentStep + 1} / {tourSteps.length}
            </span>

            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1"
            >
              {isLastStep ? "C'est parti !" : 'Suivant'}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
