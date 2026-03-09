'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  route: string;
  targetSelector?: string;
  title: string;
  description: string;
  emoji?: string;
  scrollIntoView?: string;
  isWelcome?: boolean;
}

const tourSteps: TourStep[] = [
  // === WELCOME ===
  {
    route: '/today',
    title: 'Bienvenue dans Cocorico ! 🐓',
    description:
      "Cocorico, c'est ton assistant de cuisine. Il gère ton stock, tes commandes, tes recettes et ta rentabilité — pour que tu puisses te concentrer sur ce que tu fais de mieux : cuisiner.\n\nOn va te montrer comment ça marche en suivant ta journée type.",
    emoji: '👨‍🍳',
    isWelcome: true,
  },

  // === TODAY ===
  {
    route: '/today',
    targetSelector: '[data-tour="impact-chart"]',
    title: '📊 Ton tableau de bord',
    description:
      "Quand tu commences ta journée, tu arrives ici. D'un coup d'œil tu vois combien tu as économisé ce mois, le temps gagné, et le gaspillage évité.",
  },
  {
    route: '/today',
    targetSelector: '[data-tour="quick-actions"]',
    title: '⚡ Tes actions rapides',
    description:
      "Ces 4 boutons sont tes raccourcis du quotidien. Scanner une livraison, entrer les ventes, lancer une production, ou passer une commande — tout est à un clic.",
  },

  // === RECEPTION ===
  {
    route: '/reception',
    targetSelector: '[data-tour="start-reception"]',
    title: '📦 Le matin : réception des livraisons',
    description:
      "Quand le livreur arrive, tu cliques ici. Tu scannes le bon de livraison avec ton téléphone et Cocorico reconnaît les produits, les quantités et les prix automatiquement.",
    scrollIntoView: '[data-tour="nav-reception"]',
  },
  {
    route: '/reception',
    targetSelector: '[data-tour="reception-tabs"]',
    title: '📋 Historique des réceptions',
    description:
      "L'onglet \"Historique\" te permet de retrouver toutes tes réceptions passées avec les détails : fournisseur, montant, produits reçus.",
  },

  // === PREP ===
  {
    route: '/prep',
    targetSelector: '[data-tour="start-production"]',
    title: '👨‍🍳 La mise en place : production',
    description:
      "Avant le service, tu lances tes productions ici. Tu choisis le plat, la quantité, et Cocorico déduit automatiquement tous les ingrédients de ton stock.",
    scrollIntoView: '[data-tour="nav-prep"]',
  },
  {
    route: '/prep',
    targetSelector: '[data-tour="tab-daily-menu"]',
    title: '📅 Le menu du jour',
    description:
      "Chaque jour tu peux configurer ton menu du jour ici. Sélectionne entrée, plat et dessert parmi tes recettes, et Cocorico vérifie que tu as le stock nécessaire.",
  },
  {
    route: '/prep',
    targetSelector: '[data-tour="tab-info"]',
    title: "ℹ️ Les infos du jour",
    description:
      "Cet onglet te montre ce qui nécessite ton attention : produits qui expirent aujourd'hui, le menu actif, et les stocks critiques à surveiller.",
  },

  // === SALES ===
  {
    route: '/sales',
    title: '🧾 Après le service : les ventes',
    description:
      "En fin de service, tu entres les plats vendus. Les ingrédients de chaque recette sont automatiquement déduits de ton stock. Ton inventaire reste toujours à jour.",
    scrollIntoView: '[data-tour="nav-sales"]',
  },

  // === ORDERS ===
  {
    route: '/orders',
    targetSelector: '[data-tour="tab-suggestions"]',
    title: '🔔 Commandes : les suggestions',
    description:
      "Cocorico détecte les produits qui passent sous le seuil d'alerte et te propose les quantités à commander. Les rouges sont critiques, les oranges à surveiller.",
    scrollIntoView: '[data-tour="nav-orders"]',
  },
  {
    route: '/orders',
    targetSelector: '[data-tour="tab-order"]',
    title: '🛒 Ta commande en cours',
    description:
      "Quand tu ajoutes des suggestions, elles arrivent ici groupées par fournisseur. Tu peux envoyer la commande par email ou l'exporter en PDF en un clic.",
  },
  {
    route: '/orders',
    targetSelector: '[data-tour="tab-producteurs"]',
    title: '🌾 Tes producteurs',
    description:
      "Retrouve tous tes fournisseurs avec leurs coordonnées. Tu peux les appeler, leur envoyer un email, ou voir leur localisation.",
  },

  // === MENU ===
  {
    route: '/menu',
    title: '📖 Tes recettes et menus',
    description:
      "Ici tu crées et gères tes recettes avec les ingrédients et quantités précises. Cocorico calcule le coût matière de chaque plat pour que tu saches si ton prix de vente est rentable.",
    scrollIntoView: '[data-tour="nav-menu"]',
  },

  // === INVENTORY ===
  {
    route: '/inventory',
    targetSelector: '[data-tour="tab-sync"]',
    title: "🔄 L'inventaire : la synchro",
    description:
      "Toutes les 2 semaines ou chaque mois, tu fais ta synchro. Tu comptes physiquement tes produits et tu compares avec le stock théorique. Cocorico identifie les écarts (pertes, vol, oublis).",
    scrollIntoView: '[data-tour="nav-inventory"]',
  },
  {
    route: '/inventory',
    targetSelector: '[data-tour="tab-stock"]',
    title: "📦 Le tableau de stock",
    description:
      "Tout ton inventaire en temps réel. Tu peux chercher un produit, filtrer par statut (critique, bas), trier par colonne, et modifier les quantités en direct.",
  },
  {
    route: '/inventory',
    targetSelector: '[data-tour="tab-movements"]',
    title: "📜 L'historique des mouvements",
    description:
      "Chaque entrée et sortie de stock est tracée ici : réceptions, ventes, productions, ajustements. Tu sais exactement d'où vient chaque mouvement.",
  },

  // === DLC ===
  {
    route: '/dlc',
    title: '⏰ Les dates de péremption',
    description:
      "Cocorico suit les DLC de tes produits et te prévient avant qu'ils expirent. Tu évites le gaspillage, les pertes, et tu restes conforme aux normes HACCP.",
    scrollIntoView: '[data-tour="nav-dlc"]',
  },

  // === FOOD COST ===
  {
    route: '/food-cost',
    targetSelector: '[data-tour="food-cost-card"]',
    title: '💰 Ton food cost',
    description:
      "Le pourcentage magique ! C'est le ratio entre tes achats et ton chiffre d'affaires. Vise entre 28% et 35% pour une bonne rentabilité. Vert = bon, rouge = attention.",
    scrollIntoView: '[data-tour="nav-food-cost"]',
  },
  {
    route: '/food-cost',
    targetSelector: '[data-tour="confidence-indicator"]',
    title: "🎯 L'indice de confiance",
    description:
      "Ce score te dit à quel point les données sont fiables. Plus tu scannes de factures et enregistres de ventes, plus l'indice monte et plus ton food cost est précis.",
  },

  // === FIN ===
  {
    route: '/today',
    title: "🚀 C'est parti, Chef !",
    description:
      "Tu as fait le tour complet ! Explore chaque section à ton rythme. Pour te déconnecter, ouvre le menu latéral et clique sur \"Se déconnecter\" en bas.\n\nBon service ! 🐓",
    isWelcome: true,
    emoji: '✨',
  },
];

export function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; centerMode: boolean }>({
    top: 0,
    left: 0,
    centerMode: true,
  });
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const shouldShow = localStorage.getItem('cocorico-show-tour');
    if (shouldShow === 'true') {
      setIsVisible(true);
      localStorage.removeItem('cocorico-show-tour');
    }
  }, []);

  const positionTooltip = useCallback(() => {
    const step = tourSteps[currentStep];
    if (!step?.targetSelector) {
      setTooltipPos({ top: 0, left: 0, centerMode: true });
      setSpotlightRect(null);
      setReady(true);
      return;
    }

    const target = document.querySelector(step.targetSelector);
    if (!target) {
      setTooltipPos({ top: 0, left: 0, centerMode: true });
      setSpotlightRect(null);
      setReady(true);
      return;
    }

    // Scroll target into view
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const rect = target.getBoundingClientRect();
      setSpotlightRect(rect);

      const tooltipWidth = 380;
      const tooltipHeight = 250;
      const gap = 12;

      let top = rect.top;
      let left = rect.right + gap;

      // If tooltip goes off right edge, try below
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = Math.max(16, rect.left);
        top = rect.bottom + gap;
      }

      // If tooltip goes off bottom, place above
      if (top + tooltipHeight > window.innerHeight - 16) {
        top = Math.max(16, rect.top - tooltipHeight - gap);
      }

      // Clamp
      top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
      left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

      setTooltipPos({ top, left, centerMode: false });
      setReady(true);
    }, 100);
  }, [currentStep]);

  // Navigate to step route
  useEffect(() => {
    if (!isVisible) return;
    const step = tourSteps[currentStep];
    if (!step) return;

    setReady(false);

    // Scroll sidebar nav item into view
    if (step.scrollIntoView) {
      const navEl = document.querySelector(step.scrollIntoView);
      if (navEl) {
        navEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (pathname !== step.route) {
      router.push(step.route);
    } else {
      // Already on the right route, position after a short delay for render
      const timer = setTimeout(positionTooltip, 400);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isVisible, router, pathname, positionTooltip]);

  // When route changes, position tooltip
  useEffect(() => {
    if (!isVisible) return;
    const step = tourSteps[currentStep];
    if (step && pathname === step.route) {
      const timer = setTimeout(positionTooltip, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, isVisible, currentStep, positionTooltip]);

  useEffect(() => {
    if (!isVisible) return;
    const handleResize = () => positionTooltip();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  if (!isVisible || !ready) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const pad = 6;

  return (
    <>
      {/* Overlay - no click to close */}
      <div className="fixed inset-0 z-[100] bg-black/30 pointer-events-none" />

      {/* Spotlight cutout */}
      {spotlightRect && !step.isWelcome && (
        <div
          className="fixed z-[101] rounded-lg pointer-events-none"
          style={{
            top: spotlightRect.top - pad,
            left: spotlightRect.left - pad,
            width: spotlightRect.width + pad * 2,
            height: spotlightRect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
            border: '2px solid hsl(var(--primary))',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={`fixed z-[102] max-w-[calc(100vw-32px)] ${step.isWelcome ? 'w-[440px]' : 'w-[380px]'}`}
        style={
          tooltipPos.centerMode
            ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            : { top: tooltipPos.top, left: tooltipPos.left }
        }
      >
        <div className="rounded-xl bg-card shadow-2xl border overflow-hidden">
          {/* Welcome header with big emoji */}
          {step.isWelcome && step.emoji && (
            <div className="bg-primary/10 py-8 flex justify-center">
              <span className="text-6xl">{step.emoji}</span>
            </div>
          )}

          <div className={`${step.isWelcome ? 'p-6' : 'p-5'} space-y-3`}>
            <div className="flex items-start justify-between gap-2">
              <h2 className={`font-bold ${step.isWelcome ? 'text-xl' : 'text-lg'}`}>{step.title}</h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {step.description}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              />
            </div>

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
                {isLastStep ? "C'est parti !" : currentStep === 0 ? "Commencer la visite" : 'Suivant'}
                {!isLastStep && currentStep > 0 && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>

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
