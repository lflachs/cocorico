'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Check, Package, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

type DependencyItem = {
  id: string;
  name: string;
  type: 'dish' | 'composite';
  quantityNeeded: number;
  unit: string;
  currentStock: number;
  hasStock: boolean;
  dependencies: DependencyItem[];
};

type ProductionDependencyPhaseProps = {
  selectedItemIds: string[];
  onContinue: (itemIdsToInclude: string[]) => void;
  onBack: () => void;
};

export function ProductionDependencyPhase({
  selectedItemIds,
  onContinue,
  onBack,
}: ProductionDependencyPhaseProps) {
  const [loading, setLoading] = useState(true);
  const [dependencies, setDependencies] = useState<DependencyItem[]>([]);
  const [additionalItemIds, setAdditionalItemIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    analyzeDependencies();
  }, [selectedItemIds]);

  const analyzeDependencies = async () => {
    setLoading(true);
    try {
      // Import the dependency analysis action
      const { analyzeDependenciesAction } = await import('@/lib/actions/production.actions');
      const result = await analyzeDependenciesAction(selectedItemIds);

      if (result.success && result.data) {
        setDependencies(result.data);

        // Auto-select missing dependencies
        const missingDeps = extractMissingDependencies(result.data);
        setAdditionalItemIds(missingDeps.map(d => d.id));

        // Auto-expand items with missing dependencies
        const idsWithMissingDeps = new Set<string>();
        result.data.forEach(dep => {
          if (hasMissingDependencies(dep)) {
            idsWithMissingDeps.add(dep.id);
          }
        });
        setExpandedIds(idsWithMissingDeps);
      }
    } catch (error) {
      console.error('Error analyzing dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractMissingDependencies = (deps: DependencyItem[]): DependencyItem[] => {
    const missing: DependencyItem[] = [];

    const traverse = (dep: DependencyItem) => {
      if (dep.dependencies.length > 0) {
        dep.dependencies.forEach(subDep => {
          if (!subDep.hasStock) {
            missing.push(subDep);
          }
          traverse(subDep);
        });
      }
    };

    deps.forEach(traverse);
    return missing;
  };

  const hasMissingDependencies = (dep: DependencyItem): boolean => {
    if (dep.dependencies.length === 0) return false;

    return dep.dependencies.some(subDep =>
      !subDep.hasStock || hasMissingDependencies(subDep)
    );
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const toggleAdditionalItem = (id: string) => {
    setAdditionalItemIds(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    // Combine selected items and additional dependencies
    const allItemIds = [...selectedItemIds, ...additionalItemIds];
    onContinue(allItemIds);
  };

  const renderDependencyTree = (dep: DependencyItem, level: number = 0) => {
    const isExpanded = expandedIds.has(dep.id);
    const hasDependencies = dep.dependencies.length > 0;
    const isSelected = selectedItemIds.includes(dep.id);
    const isAdditional = additionalItemIds.includes(dep.id);
    const isMissing = !dep.hasStock;

    return (
      <div key={dep.id} className="space-y-2">
        <div
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            isMissing ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20' :
            'border-border bg-card'
          }`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Expand/Collapse button */}
          {hasDependencies && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={() => toggleExpanded(dep.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Checkbox for additional items */}
          {!isSelected && dep.type === 'composite' && (
            <Checkbox
              checked={isAdditional}
              onCheckedChange={() => toggleAdditionalItem(dep.id)}
              className="shrink-0 mt-0.5"
            />
          )}

          {/* Item info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{dep.name}</span>

              {dep.type === 'composite' && (
                <Badge variant="outline" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  Préparation
                </Badge>
              )}

              {isSelected && (
                <Badge variant="default" className="text-xs">
                  Sélectionné
                </Badge>
              )}
            </div>

            {/* Stock info */}
            <div className="flex items-center gap-4 mt-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Besoin:</span>
                <span className="font-medium">
                  {dep.quantityNeeded} {dep.unit}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Stock:</span>
                <span className={`font-medium ${
                  dep.hasStock ? 'text-green-600 dark:text-green-400' :
                  'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {dep.currentStock} {dep.unit}
                  {dep.hasStock ? (
                    <Check className="inline h-4 w-4 ml-1" />
                  ) : (
                    <AlertTriangle className="inline h-4 w-4 ml-1" />
                  )}
                </span>
              </div>
            </div>

            {isMissing && dep.type === 'composite' && (
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Cette préparation n'est pas en stock. Cochez pour l'inclure dans la production.
              </p>
            )}
          </div>
        </div>

        {/* Render sub-dependencies */}
        {hasDependencies && isExpanded && (
          <div className="space-y-2">
            {dep.dependencies.map(subDep => renderDependencyTree(subDep, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const missingCount = extractMissingDependencies(dependencies).length;
  const allInStock = missingCount === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Analyse des dépendances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b space-y-2">
        <h2 className="text-xl font-bold">Vérification des dépendances</h2>

        {allInStock ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span>Tous les ingrédients sont en stock</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span>
              {missingCount} préparation{missingCount !== 1 ? 's' : ''} manquante{missingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Les recettes sélectionnées contiennent des sous-préparations.
          Vérifiez les stocks et ajoutez les préparations manquantes si nécessaire.
        </p>
      </div>

      {/* Dependency tree */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="space-y-4 max-w-4xl">
          {dependencies.map(dep => renderDependencyTree(dep))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
        <div className="flex items-center justify-between gap-4 max-w-4xl">
          <Button variant="outline" onClick={onBack}>
            Retour
          </Button>

          <div className="flex items-center gap-4">
            {additionalItemIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                +{additionalItemIds.length} préparation{additionalItemIds.length !== 1 ? 's' : ''} ajoutée{additionalItemIds.length !== 1 ? 's' : ''}
              </p>
            )}

            <Button
              onClick={handleContinue}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              Continuer ({selectedItemIds.length + additionalItemIds.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
