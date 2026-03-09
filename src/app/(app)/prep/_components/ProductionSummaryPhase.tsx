'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CompletedProduction = {
  dishId: string;
  dishName: string;
  quantity: number;
  success: boolean;
  error?: string;
};

type ProductionSummaryPhaseProps = {
  completedProductions: CompletedProduction[];
  onFinish: () => void;
};

export function ProductionSummaryPhase({
  completedProductions,
  onFinish,
}: ProductionSummaryPhaseProps) {
  const successCount = completedProductions.filter((p) => p.success).length;
  const failureCount = completedProductions.filter((p) => !p.success).length;
  const totalQuantity = completedProductions
    .filter((p) => p.success)
    .reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="flex flex-col h-full" data-tour="production-summary">
      {/* Summary header */}
      <div className="flex-shrink-0 px-6 py-6 border-b">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Production terminée!</h3>
          <p className="text-muted-foreground">
            Voici le résumé de vos préparations
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-muted-foreground mt-1">Réussie{successCount !== 1 ? 's' : ''}</div>
          </div>

          {failureCount > 0 && (
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{failureCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Échouée{failureCount !== 1 ? 's' : ''}</div>
            </div>
          )}

          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-3xl font-bold text-primary">{totalQuantity}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Portion{totalQuantity !== 1 ? 's' : ''} produite{totalQuantity !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Productions list */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <h4 className="text-lg font-semibold mb-4">Détail des productions</h4>

        {completedProductions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Aucune production effectuée
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedProductions.map((production, index) => (
              <div
                key={`${production.dishId}-${index}`}
                className={cn(
                  'flex items-start gap-4 rounded-lg border p-4',
                  production.success
                    ? 'bg-green-50/50 border-green-200'
                    : 'bg-red-50/50 border-red-200'
                )}
              >
                {/* Status icon */}
                <div className="shrink-0 mt-1">
                  {production.success ? (
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                </div>

                {/* Production info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5 className="font-semibold text-base mb-1">
                        {production.dishName}
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        Quantité: <strong>{production.quantity}</strong> portion{production.quantity !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium shrink-0',
                        production.success
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {production.success ? 'Succès' : 'Échec'}
                    </div>
                  </div>

                  {/* Error message if failed */}
                  {!production.success && production.error && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{production.error}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with finish button */}
      <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
        <Button
          onClick={onFinish}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Terminer
        </Button>
      </div>
    </div>
  );
}
