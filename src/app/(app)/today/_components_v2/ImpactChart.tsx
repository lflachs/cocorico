'use client';

import { TrendingDown, Clock, Trash2, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ImpactChartProps {
  moneySaved: number;
  timeSaved: number; // minutes
  wastePrevented: number; // kg
  period?: string;
  billCount?: number; // for tooltip
  dlcCount?: number; // for tooltip
  // Potential values from server (data-driven)
  moneyPotential: number;
  timePotential: number;
  wastePotential: number;
}

/**
 * More visual, addictive chart showing impact metrics
 * Progress bars with smooth animations + info tooltips
 */
export function ImpactChart({
  moneySaved,
  timeSaved,
  wastePrevented,
  period = 'ce mois',
  billCount = 0,
  dlcCount = 0,
  moneyPotential,
  timePotential,
  wastePotential,
}: ImpactChartProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  // Calculate progress percentages
  const moneyProgress = Math.min((moneySaved / moneyPotential) * 100, 100);
  const timeProgress = Math.min((timeSaved / timePotential) * 100, 100);
  const wasteProgress = Math.min((wastePrevented / wastePotential) * 100, 100);

  // Fun French chef comparisons
  const getMoneyComparison = (amount: number) => {
    const comparisons = [
      { min: 0, max: 50, text: "🔪 Prix d'un bon couteau de chef" },
      { min: 50, max: 100, text: "🍷 Une caisse de bon vin" },
      { min: 100, max: 200, text: "👨‍🍳 Un tablier Le Creuset + toque" },
      { min: 200, max: 300, text: "🍽️ Un service complet pour 4" },
      { min: 300, max: 500, text: "🍲 Une cocotte Le Creuset XXL" },
      { min: 500, max: 1000, text: "⭐ Un stage chez Bocuse" },
      { min: 1000, max: Infinity, text: "🤖 Un robot Thermomix" },
    ];
    const comp = comparisons.find(c => amount >= c.min && amount < c.max);
    return comp?.text || "🎉 Impressionnant !";
  };

  const getTimeComparison = (minutes: number) => {
    const comparisons = [
      { min: 0, max: 15, text: "⚡ Temps pour une mise en place rapide" },
      { min: 15, max: 30, text: "🍗 Faire un bon fond de volaille" },
      { min: 30, max: 60, text: "✨ Temps pour créer un nouveau plat" },
      { min: 60, max: 120, text: "🍾 Préparer un menu dégustation" },
      { min: 120, max: 240, text: "🔥 Un service complet du midi" },
      { min: 240, max: 480, text: "📦 Prep complète pour le weekend" },
      { min: 480, max: Infinity, text: "🚀 Une semaine de mise en place !" },
    ];
    const comp = comparisons.find(c => minutes >= c.min && minutes < c.max);
    return comp?.text || "💪 Énorme gain !";
  };

  const getWasteComparison = (kg: number) => {
    const comparisons = [
      { min: 0, max: 2, text: "🐔 Un poulet fermier" },
      { min: 2, max: 5, text: "🐟 Un saumon entier" },
      { min: 5, max: 10, text: "🥖 Une miche de pain par jour" },
      { min: 10, max: 20, text: "🥩 Un carré d'agneau par semaine" },
      { min: 20, max: 50, text: "🥕 Vos légumes du marché hebdo" },
      { min: 50, max: 100, text: "🐷 Un demi-cochon" },
      { min: 100, max: Infinity, text: "🐄 Un veau entier !" },
    ];
    const comp = comparisons.find(c => kg >= c.min && kg < c.max);
    return comp?.text || "🏆 Bravo Chef !";
  };


  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Money Saved */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-muted">
                <TrendingDown className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Argent économisé</span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0.5 hover:bg-muted rounded">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Comment c'est calculé :</strong><br/>
                    Valeur des produits DLC trackés × 15%<br/>
                    <br/>
                    <strong>Pourquoi ?</strong><br/>
                    Les restos perdent 15-20% en gaspillage sans tracking.
                    En trackant tes DLC, tu utilises les produits avant qu'ils périment.<br/>
                    <br/>
                    <strong>Potentiel :</strong><br/>
                    Tu pourrais économiser €{Math.round(moneyPotential)} en trackant tous tes produits !
                    {dlcCount > 0 && (
                      <>
                        <br/><br/>
                        <strong>Ce mois :</strong> {dlcCount} produits trackés
                      </>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              €{moneySaved > 0 ? moneySaved.toFixed(0) : '0'}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <span>/ €{Math.round(moneyPotential)} potentiel</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0.5 hover:bg-muted rounded">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Potentiel :</strong><br/>
                    Basé sur la valeur de tes produits trackables qui n'ont PAS encore de DLC ce mois.<br/>
                    <br/>
                    Plus tu tracks, plus tu économises ! Le potentiel = 15% de la valeur non-trackée.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${moneyProgress}%` }}
          />
        </div>

        {moneySaved > 0 && (
          <p className="text-xs text-muted-foreground">
            ≈ {getMoneyComparison(moneySaved)}
          </p>
        )}
      </div>

        {/* Time Saved */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-muted">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Temps gagné</span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0.5 hover:bg-muted rounded">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Comment c'est calculé :</strong><br/>
                    • Facture scannée = 8min gagné (vs Excel)<br/>
                    • DLC entrée = 3min gagné (vs carnet)<br/>
                    • Vente entrée = 5min gagné (vs calcul manuel)<br/>
                    • Admin hebdo = 30min gagné (food cost auto)<br/>
                    <br/>
                    <strong>Potentiel :</strong><br/>
                    Tu pourrais gagner {formatTime(timePotential)} en utilisant toutes les fonctionnalités !
                    {(billCount > 0 || dlcCount > 0) && (
                      <>
                        <br/><br/>
                        <strong>Ce mois :</strong><br/>
                        {billCount > 0 && `• ${billCount} factures (${billCount * 8}min)`}<br/>
                        {dlcCount > 0 && `• ${dlcCount} DLC (${dlcCount * 3}min)`}
                      </>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {timeSaved > 0 ? formatTime(timeSaved) : '0min'}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <span>/ {formatTime(timePotential)} potentiel</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0.5 hover:bg-muted rounded">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Potentiel :</strong><br/>
                    Si tu utilises toutes les fonctionnalités :<br/>
                    • 1 facture/jour = 4h/mois<br/>
                    • 5 DLC/semaine = 1h/mois<br/>
                    • Ventes 3×/semaine = 1h/mois<br/>
                    • Admin auto = 2h/mois<br/>
                    <br/>
                    <strong>Total potentiel :</strong> ~8h/mois<br/>
                    <br/>
                    Plus tu utilises l'app, plus tu gagnes de temps !
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${timeProgress}%` }}
          />
        </div>

        {timeSaved > 0 && (
          <p className="text-xs text-muted-foreground">
            ≈ {getTimeComparison(timeSaved)}
          </p>
        )}
      </div>

        {/* Waste Prevented */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-muted">
                <Trash2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Gaspillage évité</span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0.5 hover:bg-muted rounded">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Comment c'est calculé :</strong><br/>
                    Poids des produits DLC trackés × 10%<br/>
                    <br/>
                    <strong>Pourquoi ?</strong><br/>
                    Tracker les DLC prévient ~10% de gaspillage.
                    Tu reçois des alertes et utilises les produits à temps.<br/>
                    <br/>
                    <strong>Potentiel :</strong><br/>
                    Tu pourrais éviter {wastePotential.toFixed(0)}kg en trackant tout !
                    {dlcCount > 0 && (
                      <>
                        <br/><br/>
                        <strong>Ce mois :</strong> {dlcCount} produits surveillés
                      </>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {wastePrevented > 0 ? `${wastePrevented.toFixed(1)}kg` : '0kg'}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <span>/ {wastePotential.toFixed(0)}kg potentiel</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0.5 hover:bg-muted rounded">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Potentiel :</strong><br/>
                    Basé sur le poids total de tes produits trackables en stock.<br/>
                    <br/>
                    En trackant tous les produits périssables, tu peux prévenir ~10% de gaspillage supplémentaire !
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${wasteProgress}%` }}
          />
        </div>

        {wastePrevented > 0 && (
          <p className="text-xs text-muted-foreground">
            ≈ {getWasteComparison(wastePrevented)}
          </p>
        )}
      </div>

        {/* Overall progress indicator */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progression globale</span>
            <span className="font-semibold">
              {Math.round((moneyProgress + timeProgress + wasteProgress) / 3)}%
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
