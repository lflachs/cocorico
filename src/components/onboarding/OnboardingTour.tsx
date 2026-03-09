'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  route: string;
  targetSelector?: string;
  title: string;
  description: string;
  position?: 'bottom' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    route: '/today',
    title: 'Bienvenue, Chef !',
    description:
      "On va te faire visiter Cocorico en suivant ta journée type. Ici c'est ton tableau de bord : tu vois d'un coup d'œil ton impact du mois et les alertes à traiter.",
    position: 'center',
  },
  {
    route: '/reception',
    targetSelector: '[data-tour="nav-reception"]',
    title: 'Le matin, tu reçois tes livraisons',
    description:
      "Quand le livreur arrive, tu scannes le bon de livraison avec ton téléphone. Cocorico reconnaît les produits et met à jour ton stock automatiquement. Plus besoin de tout saisir à la main.",
    position: 'right',
  },
  {
    route: '/prep',
    targetSelector: '[data-tour="nav-prep"]',
    title: 'Ensuite, tu lances la production',
    description:
      "Avant le service, tu consultes ce qu'il faut préparer. Quand tu enregistres une production, les ingrédients sont déduits du stock. Tu sais toujours ce qu'il te reste.",
    position: 'right',
  },
  {
    route: '/sales',
    targetSelector: '[data-tour="nav-sales"]',
    title: 'Après le service, tu enregistres les ventes',
    description:
      "En fin de service, tu entres le nombre de plats vendus. Cocorico déduit automatiquement les ingrédients de chaque recette. Ton stock reste à jour sans effort.",
    position: 'right',
  },
  {
    route: '/orders',
    targetSelector: '[data-tour="nav-orders"]',
    title: 'Et tu prépares les commandes du lendemain',
    description:
      "Cocorico détecte les produits qui passent sous le seuil et te propose les quantités à commander. Tu valides et tu envoies la commande à tes fournisseurs en un clic.",
    position: 'right',
  },
  {
    route: '/menu',
    targetSelector: '[data-tour="nav-menu"]',
    title: 'Tes recettes et tes menus',
    description:
      "Tu crées tes recettes avec les ingrédients et les quantités. Cocorico calcule le coût matière de chaque plat pour que tu saches toujours si ton prix est rentable.",
    position: 'right',
  },
  {
    route: '/inventory',
    targetSelector: '[data-tour="nav-inventory"]',
    title: 'Régulièrement, tu fais ton inventaire',
    description:
      "Toutes les deux semaines ou chaque mois, tu comptes ton stock physique et tu compares avec le théorique. Les écarts apparaissent et tu ajustes en quelques clics.",
    position: 'right',
  },
  {
    route: '/dlc',
    targetSelector: '[data-tour="nav-dlc"]',
    title: 'Tu gardes un œil sur les DLC',
    description:
      "Cocorico te prévient avant qu'un produit expire. Tu évites le gaspillage et les pertes, et tu restes conforme aux normes HACCP.",
    position: 'right',
  },
  {
    route: '/food-cost',
    targetSelector: '[data-tour="nav-food-cost"]',
    title: 'Et tu suis ta rentabilité',
    description:
      "Tu visualises ton food cost par plat et par période. Tu identifies les plats les plus rentables et tu optimises ta carte pour maximiser ta marge.",
    position: 'right',
  },
  {
    route: '/today',
    title: "C'est parti, Chef !",
    description:
      "Tu as fait le tour ! Explore chaque section à ton rythme. Pour te déconnecter, ouvre le menu latéral et clique sur \"Se déconnecter\" en bas.",
    position: 'center',
  },
];

export function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const [hasNavigated, setHasNavigated] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shouldShow = localStorage.getItem('cocorico-show-tour');
    if (shouldShow === 'true') {
      setIsVisible(true);
      localStorage.removeItem('cocorico-show-tour');
    }
  }, []);

  const positionTooltip = useCallback(() => {
    const step = tourSteps[currentStep];
    if (!step) return;

    if (step.position === 'center' || !step.targetSelector) {
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      setSpotlightStyle({ display: 'none' });
      return;
    }

    const target = document.querySelector(step.targetSelector);
    if (!target) {
      // Fallback to center if target not found
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      setSpotlightStyle({ display: 'none' });
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = 6;

    // Spotlight around the target element
    setSpotlightStyle({
      display: 'block',
      position: 'fixed',
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      borderRadius: '8px',
    });

    // Position tooltip to the right of the target
    setTooltipStyle({
      position: 'fixed',
      top: rect.top,
      left: rect.right + 16,
    });
  }, [currentStep]);

  // Navigate to step route when step changes
  useEffect(() => {
    if (!isVisible) return;
    const step = tourSteps[currentStep];
    if (step && pathname !== step.route) {
      setHasNavigated(false);
      router.push(step.route);
    } else {
      setHasNavigated(true);
    }
  }, [currentStep, isVisible, router, pathname]);

  // Reposition when route changes
  useEffect(() => {
    if (!isVisible) return;
    const step = tourSteps[currentStep];
    if (step && pathname === step.route) {
      setHasNavigated(true);
      // Small delay to let the page render
      const timer = setTimeout(positionTooltip, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, isVisible, currentStep, positionTooltip]);

  // Reposition on resize
  useEffect(() => {
    if (!isVisible) return;
    window.addEventListener('resize', positionTooltip);
    return () => window.removeEventListener('resize', positionTooltip);
  }, [isVisible, positionTooltip]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setCurrentStep(0);
    router.push('/today');
  }, [router]);

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

  if (!isVisible || !hasNavigated) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isCenter = step.position === 'center' || !step.targetSelector;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={handleClose} />

      {/* Spotlight cutout */}
      {spotlightStyle.display !== 'none' && (
        <div
          className="z-[61] pointer-events-none"
          style={{
            ...spotlightStyle,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`z-[62] w-full ${isCenter ? 'max-w-md px-4' : 'max-w-sm'}`}
        style={tooltipStyle}
      >
        <div className="rounded-xl bg-card shadow-2xl border overflow-hidden">
          <div className="p-5 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold">{step.title}</h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="gap-1 h-8"
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
                className="gap-1 h-8"
              >
                {isLastStep ? "C'est parti !" : 'Suivant'}
                {!isLastStep && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>

            {/* Skip link */}
            {!isLastStep && (
              <div className="text-center">
                <button
                  onClick={handleClose}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Passer le guide
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
