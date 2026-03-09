'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  route: string;
  targetSelector?: string;
  clickSelector?: string;
  autoAction?: string;
  waitForSelector?: string;
  title: string;
  description: string;
  emoji?: string;
  scrollIntoView?: string;
  isWelcome?: boolean;
  /** Delay in ms before positioning after autoAction (default 600) */
  autoActionDelay?: number;
  /** Selector of an input to type a value into (simulates user typing) */
  typeInto?: string;
  /** Value to type into the input */
  typeValue?: string;
}

// Global flag: dialogs should not close when the tour is active
if (typeof window !== 'undefined') {
  (window as any).__cocorico_tour_active = false;
}

/** Wait for a DOM element to appear, polling with MutationObserver */
function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) {
      resolve(el);
      return;
    }

    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
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
    targetSelector: '[data-tour="urgent-alerts"]',
    title: '🚨 À traiter',
    description:
      "Comme tu peux le voir ici, Cocorico t'alerte dès l'écran d'accueil s'il y a des produits qui vont bientôt expirer ou un stock critique. Ces alertes sont mises en avant pour que tu ne rates rien.",
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
      "Quand le livreur arrive, tu cliques ici. Tu scannes le bon de livraison avec ton téléphone et Cocorico reconnaît les produits, les quantités et les prix automatiquement. Plus besoin de tout saisir à la main !",
    scrollIntoView: '[data-tour="nav-reception"]',
  },
  {
    route: '/reception',
    targetSelector: '[data-tour="tab-history"]',
    clickSelector: '[data-tour="tab-history"]',
    title: '📋 Historique des réceptions',
    description:
      "L'onglet \"Historique\" te permet de retrouver toutes tes réceptions passées avec les détails : fournisseur, montant, produits reçus. Pratique pour vérifier une livraison ou contester une facture.",
  },

  // === PREP ===
  {
    route: '/prep',
    targetSelector: '[data-tour="start-production"]',
    clickSelector: '[data-tour="tab-production"]',
    title: '👨‍🍳 La mise en place : production',
    description:
      "Avant le service, tu lances tes productions ici. Tu choisis le plat, la quantité, et Cocorico déduit automatiquement tous les ingrédients de ton stock. On va te montrer comment ça marche !",
    scrollIntoView: '[data-tour="nav-prep"]',
  },

  // === PRODUCTION LIVE WALKTHROUGH ===
  {
    route: '/prep/production',
    targetSelector: '[data-tour="production-flow"]',
    title: '🍳 L\'écran de sélection',
    description:
      "Voici toutes tes recettes et préparations. Tu peux filtrer par catégorie à gauche et chercher par nom. On va sélectionner un plat pour te montrer la suite...",
    waitForSelector: '[data-tour="first-recipe"]',
  },
  {
    route: '/prep/production',
    targetSelector: '[data-tour="production-continue"]',
    autoAction: '[data-tour="first-recipe"] > div',
    waitForSelector: '[data-tour="production-continue"]',
    title: '✅ Plat sélectionné !',
    description:
      "On a sélectionné un plat. Tu peux en cocher plusieurs si tu veux tout préparer d'un coup. Quand tu es prêt, clique sur \"Continuer\" pour voir le détail des ingrédients.",
    autoActionDelay: 400,
  },
  {
    route: '/prep/production',
    targetSelector: '[data-tour="quantity-selector"]',
    autoAction: '[data-tour="production-continue"]',
    waitForSelector: '[data-tour="quantity-selector"]',
    title: '🔢 Choisis ta quantité',
    description:
      "D'abord, tu choisis combien tu veux produire. Utilise les boutons + et − ou tape directement le chiffre. On va augmenter la quantité pour te montrer l'effet sur les ingrédients...",
    autoActionDelay: 1000,
  },
  {
    route: '/prep/production',
    targetSelector: '[data-tour="ingredients-panel"]',
    autoAction: '[data-tour="quantity-plus"]',
    title: '📦 Les ingrédients se mettent à jour',
    description:
      "Tu vois ? Quand tu changes la quantité, les ingrédients requis se recalculent automatiquement. Vert = stock suffisant. Orange = attention, il en manque peut-être. Chaque ligne montre ce qu'il faut et ce qui est en stock.",
    autoActionDelay: 800,
  },
  {
    route: '/prep/production',
    targetSelector: '[data-tour="prepare-also"], [data-tour="prepare-first"]',
    title: '🧪 Préparer un sous-ingrédient',
    description:
      "Certains ingrédients sont eux-mêmes des préparations (marinades, sauces...). Ce bouton te permet de les ajouter à ta file de production. Cliquons dessus pour voir !",
    autoAction: '[data-tour="prepare-also"], [data-tour="prepare-first"]',
    autoActionDelay: 1000,
  },
  {
    route: '/prep/production',
    targetSelector: '[data-tour="production-step"]',
    title: '🔗 Sous-préparation ajoutée !',
    description:
      "Cocorico a ajouté la sous-préparation à ta file. Elle sera produite avant le plat principal pour que les ingrédients soient prêts. Tu peux enchaîner les productions les unes après les autres.",
  },
  {
    route: '/prep/production',
    targetSelector: '[data-tour="production-produce"]',
    title: '🚀 Lancer la production',
    description:
      "Quand tout est bon, tu cliques ici pour produire. Cocorico déduit automatiquement les ingrédients de ton stock et ajoute les produits finis. Si le bouton est grisé, c'est qu'il manque un ingrédient.",
  },

  // === BACK TO PREP TABS — MENU DU JOUR ===
  {
    route: '/prep',
    targetSelector: '[data-tour="tab-daily-menu"]',
    clickSelector: '[data-tour="tab-daily-menu"]',
    title: '📅 Le menu du jour',
    description:
      "Chaque jour tu peux configurer ton menu du jour ici. Ça te permet de définir les ingrédients du plat du jour pour que le stock se mette à jour quand tu enregistres des ventes.",
  },
  {
    route: '/prep',
    targetSelector: '[data-tour="start-daily-menu"]',
    clickSelector: '[data-tour="tab-daily-menu"]',
    title: '📝 Configurer le menu',
    description:
      "Clique ici pour ouvrir la page de configuration. Tu vas pouvoir chercher tes ingrédients et les ajouter au menu du jour avec les bonnes quantités par portion.",
  },
  {
    route: '/prep/daily-menu',
    targetSelector: '[data-tour="daily-menu-products"]',
    title: '🥕 Les ingrédients disponibles',
    description:
      "À gauche, tu vois tous tes produits en stock. Tu peux chercher un ingrédient et cliquer sur + pour l'ajouter au menu du jour.",
  },
  {
    route: '/prep/daily-menu',
    targetSelector: '[data-tour="daily-menu-selected"]',
    title: '✅ Les ingrédients sélectionnés',
    description:
      "À droite, tu retrouves les ingrédients choisis avec la quantité par portion. Quand tu enregistres une vente du menu du jour, Cocorico déduit automatiquement les ingrédients du stock.",
  },

  // === BACK TO PREP TABS — INFOS DU JOUR ===
  {
    route: '/prep',
    targetSelector: '[data-tour="tab-info"]',
    clickSelector: '[data-tour="tab-info"]',
    title: "ℹ️ Les infos du jour",
    description:
      "Cet onglet te montre ce qui nécessite ton attention : produits qui expirent aujourd'hui, le menu actif, et les stocks critiques à surveiller.",
  },

  // === SALES ===
  {
    route: '/sales',
    title: '🧾 Après le service : les ventes',
    description:
      "Tu peux scanner ton ticket de caisse et Cocorico reconnaît les plats vendus automatiquement. Les ingrédients de chaque recette sont déduits du stock sans rien saisir à la main.\n\nCe n'est pas obligatoire — tu peux aussi faire une synchro manuelle de ton stock régulièrement (on va voir ça juste après).",
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
    targetSelector: '[data-tour="suggestion-card"]',
    title: '➕ Ajouter à la commande',
    description:
      "Chaque carte montre le stock actuel, le niveau cible et la quantité suggérée. Tu peux ajuster la quantité puis cliquer « Ajouter à la commande » pour l'ajouter au panier.",
  },
  {
    route: '/orders',
    targetSelector: '[data-tour="order-actions"]',
    autoAction: '[data-tour="add-to-order"]',
    clickSelector: '[data-tour="tab-order"]',
    autoActionDelay: 800,
    waitForSelector: '[data-tour="order-actions"]',
    title: '📧 Envoyer ou exporter',
    description:
      "Ta commande est groupée par fournisseur. Tu peux l'envoyer directement par email au fournisseur, ou l'exporter en PDF pour l'imprimer ou l'envoyer autrement. Un clic et c'est parti !",
  },
  {
    route: '/orders',
    targetSelector: '[data-tour="tab-producteurs"]',
    clickSelector: '[data-tour="tab-producteurs"]',
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
  {
    route: '/menu',
    targetSelector: '[data-tour="first-menu-card"]',
    title: '🍽️ Ouvrir un menu',
    description:
      "Chaque carte représente un menu. Ouvrons le premier pour voir ce qu'il contient !",
    autoAction: '[data-tour="first-menu-card"]',
    autoActionDelay: 800,
  },
  {
    route: '/menu',
    targetSelector: '[data-tour="menu-detail"]',
    title: '📋 Le détail du menu',
    description:
      "Voici le détail du menu avec ses sections (entrées, plats, desserts) et les plats qui le composent. Tu peux modifier chaque plat, ajuster les prix, et gérer les recettes directement ici.",
  },
  {
    route: '/menu',
    targetSelector: '[data-tour="menu-quick-create"]',
    autoAction: '[data-tour="menu-back"]',
    waitForSelector: '[data-tour="menu-quick-create"]',
    autoActionDelay: 600,
    title: '⚡ Créer un menu rapidement',
    description:
      "Ce bouton ouvre un assistant de création rapide. Tu donnes un nom à ton menu, tu choisis le type de prix (fixe ou au choix), puis tu peux scanner ta carte — un PDF, une photo de ton menu imprimé, ou même une feuille manuscrite ! Cocorico reconnaît les plats et les crée automatiquement.",
  },

  // === INVENTORY ===
  {
    route: '/inventory',
    targetSelector: '[data-tour="tab-sync"]',
    title: "🔄 L'inventaire : la synchro",
    description:
      "Même si tu ne scannes pas tes tickets, tu peux garder ton stock à jour avec la synchro. Toutes les 2 semaines ou chaque mois, tu comptes physiquement tes produits et Cocorico compare avec le stock théorique pour identifier les écarts (pertes, oublis...).",
    scrollIntoView: '[data-tour="nav-inventory"]',
  },
  {
    route: '/inventory',
    targetSelector: '[data-tour="sync-how-it-works"]',
    title: '🧩 Pas besoin de tout faire d\'un coup',
    description:
      "Tu peux arrêter la synchro quand tu veux et reprendre plus tard. Même 5 produits comptés, c'est déjà mieux que rien ! Cocorico priorise les produits les plus anciens.",
  },
  {
    route: '/inventory',
    targetSelector: '[data-tour="tab-stock"]',
    clickSelector: '[data-tour="tab-stock"]',
    title: "📦 Le tableau de stock",
    description:
      "Tout ton inventaire en temps réel. Tu peux chercher un produit, filtrer par statut (critique, bas), trier par colonne, et modifier les quantités en direct.",
  },
  {
    route: '/inventory',
    targetSelector: '[data-tour="stock-search"]',
    clickSelector: '[data-tour="tab-stock"]',
    typeInto: '[data-tour="stock-search"]',
    typeValue: 'marinade',
    title: '🔍 Retrouve ta production',
    description:
      "Tu te souviens de la Marinade pour viande rouge qu'on vient de préparer ? Cherchons-la dans le stock. Tu peux voir que la quantité produite a bien été ajoutée à l'inventaire !",
  },
  {
    route: '/inventory',
    targetSelector: '[data-tour="tab-movements"]',
    clickSelector: '[data-tour="tab-movements"]',
    typeInto: '[data-tour="stock-search"]',
    typeValue: '',
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

  // === PRICE HISTORY ===
  {
    route: '/price-history',
    title: '📈 L\'historique des prix',
    description:
      "Cocorico suit l'évolution des prix de tes fournisseurs à chaque facture scannée. Tu vois quand un produit a augmenté ou baissé, et tu peux comparer les prix entre fournisseurs pour négocier.",
    scrollIntoView: '[data-tour="nav-price-history"]',
  },

  // === INSIGHTS ===
  {
    route: '/insights',
    title: '📊 Les insights',
    description:
      "Ton tableau de bord anti-gaspillage. Tu vois les produits périmés évités, la précision de ton inventaire, les écarts de stock, et l'impact de tes sous-produits. Plus tu utilises Cocorico, plus ces données deviennent précieuses.",
    scrollIntoView: '[data-tour="nav-insights"]',
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
  const [mounted, setMounted] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; centerMode: boolean }>({
    top: 0,
    left: 0,
    centerMode: true,
  });
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const setupInProgress = useRef(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Mount portal
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const shouldShow = localStorage.getItem('cocorico-show-tour');
    if (shouldShow === 'true') {
      setIsVisible(true);
      localStorage.removeItem('cocorico-show-tour');
    }
  }, []);

  // Sync global flag so dialogs know tour is active
  useEffect(() => {
    (window as any).__cocorico_tour_active = isVisible;
    return () => { (window as any).__cocorico_tour_active = false; };
  }, [isVisible]);

  const positionTooltip = useCallback(() => {
    clampedRef.current = false;
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
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // If target covers >60% of viewport, don't spotlight — just center tooltip
      const targetArea = rect.width * rect.height;
      const viewportArea = vw * vh;
      if (targetArea > viewportArea * 0.6) {
        setSpotlightRect(null);
        setTooltipPos({ top: 0, left: 0, centerMode: true });
        setReady(true);
        return;
      }

      setSpotlightRect(rect);

      const tooltipWidth = 380;
      const tooltipHeight = 280;
      const gap = 14;
      const margin = 16;

      // Calculate available space in each direction (without overlapping target)
      const spaceRight = vw - rect.right - gap - margin;
      const spaceLeft = rect.left - gap - margin;
      const spaceBelow = vh - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;

      type Placement = { top: number; left: number; score: number };
      const placements: Placement[] = [];

      // Right of target
      if (spaceRight >= tooltipWidth) {
        placements.push({
          top: Math.max(margin, Math.min(rect.top, vh - tooltipHeight - margin)),
          left: rect.right + gap,
          score: spaceRight,
        });
      }

      // Left of target
      if (spaceLeft >= tooltipWidth) {
        placements.push({
          top: Math.max(margin, Math.min(rect.top, vh - tooltipHeight - margin)),
          left: rect.left - gap - tooltipWidth,
          score: spaceLeft,
        });
      }

      // Below target
      if (spaceBelow >= tooltipHeight) {
        placements.push({
          top: rect.bottom + gap,
          left: Math.max(margin, Math.min(rect.left, vw - tooltipWidth - margin)),
          score: spaceBelow + 50, // Prefer below slightly
        });
      }

      // Above target
      if (spaceAbove >= tooltipHeight) {
        placements.push({
          top: rect.top - gap - tooltipHeight,
          left: Math.max(margin, Math.min(rect.left, vw - tooltipWidth - margin)),
          score: spaceAbove,
        });
      }

      let top: number;
      let left: number;

      if (placements.length > 0) {
        // Pick placement with highest score (most space)
        const best = placements.sort((a, b) => b.score - a.score)[0];
        top = best.top;
        left = best.left;
      } else {
        // Fallback: bottom-right corner, won't overlap if target is small
        top = vh - tooltipHeight - margin;
        left = vw - tooltipWidth - margin;
      }

      // Final clamp
      top = Math.max(margin, Math.min(top, vh - tooltipHeight - margin));
      left = Math.max(margin, Math.min(left, vw - tooltipWidth - margin));

      setTooltipPos({ top, left, centerMode: false });
      setReady(true);
    }, 150);
  }, [currentStep]);

  /** Full step setup: click tabs, perform auto-actions, wait for elements, position */
  const setupStep = useCallback(async () => {
    if (setupInProgress.current) return;
    setupInProgress.current = true;

    const step = tourSteps[currentStep];
    if (!step) {
      setupInProgress.current = false;
      return;
    }

    try {
      // 0. Close any open dialogs if this step doesn't need elements inside one
      const openDialog = document.querySelector('[role="dialog"]');
      let stepNeedsDialog = false;
      if (openDialog) {
        // Check if any of this step's selectors reference elements inside the dialog
        const selectors = [step.targetSelector, step.waitForSelector, step.autoAction].filter(Boolean) as string[];
        for (const sel of selectors) {
          try {
            if (openDialog.querySelector(sel)) {
              stepNeedsDialog = true;
              break;
            }
          } catch { /* invalid selector, ignore */ }
        }
        // Also check by selector string as fallback (for elements not yet rendered)
        if (!stepNeedsDialog) {
          stepNeedsDialog = selectors.some(s => s.includes('dialog') || s.includes('sync-start') || s.includes('sync-product') || s.includes('sync-categor'));
        }
      }
      if (openDialog && !stepNeedsDialog) {
        // Temporarily disable tour flag so dialog can close
        (window as any).__cocorico_tour_active = false;
        const closeBtn = openDialog.querySelector('button[class*="close"], button:has(.lucide-x)') as HTMLElement;
        if (closeBtn) {
          closeBtn.click();
          await new Promise((r) => setTimeout(r, 400));
        } else {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          await new Promise((r) => setTimeout(r, 400));
        }
        (window as any).__cocorico_tour_active = true;
      }

      // 1. Perform auto-action FIRST (select recipe, add to order, etc.)
      //    This runs before tab switching so the action targets the current view
      //    Uses simple .click() — full pointer sequence can cause dialogs to close
      if (step.autoAction) {
        const actionTarget = await waitForElement(step.autoAction, 3000);
        if (actionTarget) {
          const el = actionTarget as HTMLElement;
          // Scroll into view first — button may be inside a scrollable panel
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await new Promise((r) => setTimeout(r, 300));
          el.click();
          await new Promise((r) => setTimeout(r, step.autoActionDelay || 600));
        }
      }

      // 2. Click tab/element (for switching tabs — after auto-action)
      if (step.clickSelector) {
        const clickTarget = document.querySelector(step.clickSelector) as HTMLElement;
        if (clickTarget) {
          // Fire full pointer sequence for Radix UI compatibility
          clickTarget.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window }));
          clickTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
          clickTarget.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window }));
          clickTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
          clickTarget.click();
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      // 2b. Type into an input field (simulate user typing)
      if (step.typeInto && step.typeValue !== undefined) {
        const input = await waitForElement(step.typeInto, 3000) as HTMLInputElement | null;
        if (input) {
          // Focus and clear
          input.focus();
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          )?.set;
          nativeInputValueSetter?.call(input, step.typeValue);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      // 3. Wait for target element to appear
      if (step.waitForSelector) {
        await waitForElement(step.waitForSelector, 5000);
        await new Promise((r) => setTimeout(r, 300));
      }

      // 4. Position tooltip
      positionTooltip();
    } finally {
      setupInProgress.current = false;
    }
  }, [currentStep, positionTooltip]);

  // Navigate to step route
  useEffect(() => {
    if (!isVisible) return;
    const step = tourSteps[currentStep];
    if (!step) return;

    // Reset lock so new step can run
    setupInProgress.current = false;
    setReady(false);

    // Scroll sidebar nav item into view
    if (step.scrollIntoView) {
      const navEl = document.querySelector(step.scrollIntoView);
      if (navEl) {
        navEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (pathname !== step.route) {
      // Close any open dialogs before navigating (dispatch Escape key)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      // Small delay to let dialog close, then navigate
      const navTimer = setTimeout(() => router.push(step.route), 100);
      return () => clearTimeout(navTimer);
    } else {
      // Already on the right route, setup step
      const timer = setTimeout(setupStep, 400);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isVisible, router, pathname, setupStep]);

  // When route changes, setup step
  useEffect(() => {
    if (!isVisible) return;
    const step = tourSteps[currentStep];
    if (step && pathname === step.route) {
      const timer = setTimeout(setupStep, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, isVisible, currentStep, setupStep]);

  // Post-render: measure actual tooltip and re-clamp if it overflows viewport
  const clampedRef = useRef(false);
  useEffect(() => {
    if (!ready || !tooltipRef.current || tooltipPos.centerMode) {
      clampedRef.current = false;
      return;
    }
    // Only clamp once per position to avoid infinite loop
    if (clampedRef.current) return;

    // Use requestAnimationFrame to ensure browser has painted the tooltip
    requestAnimationFrame(() => {
      if (!tooltipRef.current) return;
      const el = tooltipRef.current;
      const elRect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const m = 16;
      let { top, left } = tooltipPos;
      let changed = false;

      // Clamp bottom
      if (elRect.bottom > vh - m) {
        top = vh - elRect.height - m;
        changed = true;
      }
      // Clamp right
      if (elRect.right > vw - m) {
        left = vw - elRect.width - m;
        changed = true;
      }
      // Clamp top
      if (top < m) { top = m; changed = true; }
      // Clamp left
      if (left < m) { left = m; changed = true; }

      if (changed) {
        clampedRef.current = true;
        setTooltipPos({ top, left, centerMode: false });
      }
    });
  }, [ready, tooltipPos]);

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

  if (!isVisible || !mounted) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const pad = 6;

  // While loading (not ready), show a subtle overlay to block clicks but no tooltip
  if (!ready) {
    return createPortal(
      <div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99990,
          backgroundColor: 'rgba(0,0,0,0.15)',
          transition: 'opacity 200ms',
        }}
      />,
      document.body
    );
  }

  return createPortal(
    <>
      {/* Overlay — only shown when no spotlight (welcome/center mode) */}
      {(!spotlightRect || step.isWelcome) && (
        <div
          className="pointer-events-none"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99990,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        />
      )}

      {/* Spotlight cutout — acts as overlay + cutout in one via boxShadow */}
      {spotlightRect && !step.isWelcome && (
        <div
          className="pointer-events-none"
          style={{
            position: 'fixed',
            zIndex: 99991,
            top: spotlightRect.top - pad,
            left: spotlightRect.left - pad,
            width: spotlightRect.width + pad * 2,
            height: spotlightRect.height + pad * 2,
            borderRadius: 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
            border: '2px solid hsl(var(--primary))',
          }}
        />
      )}

      {/* Tooltip — stopPropagation prevents Radix dialogs from treating clicks as "outside" */}
      <div
        ref={tooltipRef}
        data-tour-tooltip="true"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          zIndex: 99992,
          maxWidth: 'calc(100vw - 32px)',
          width: step.isWelcome ? 440 : 380,
          ...(tooltipPos.centerMode
            ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            : { top: tooltipPos.top, left: tooltipPos.left }),
        }}
      >
        <div className="rounded-xl bg-card shadow-2xl border overflow-hidden" style={{ maxHeight: 'calc(100vh - 32px)' }}>
          {/* Welcome header with big emoji */}
          {step.isWelcome && step.emoji && (
            <div className="bg-primary/10 py-8 flex justify-center">
              <span className="text-6xl">{step.emoji}</span>
            </div>
          )}

          <div className={`${step.isWelcome ? 'p-6' : 'p-5'} space-y-3`} style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 48px)' }}>
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
    </>,
    document.body
  );
}
