'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, TrendingDown, RefreshCw, Package, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type StockMovement = {
  id: string;
  productId: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'INITIAL';
  quantity: number;
  balanceAfter: number;
  movementDate: Date;
  reason: string;
  description?: string | null;
  source: string;
  product: {
    name: string;
    unit: string;
  };
};

export function StockMovementsList() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMovements();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMovements(movements);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = movements.filter(
        (m) =>
          m.product.name.toLowerCase().includes(query) ||
          m.reason.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
      );
      setFilteredMovements(filtered);
    }
  }, [searchQuery, movements]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock-movements?limit=100');
      if (response.ok) {
        const data = await response.json();
        setMovements(data);
        setFilteredMovements(data);
      }
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'OUT':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'OUT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      MANUAL: 'Manuel',
      SCAN_RECEPTION: 'Réception',
      SCAN_SALES: 'Vente',
      RECIPE_DEDUCTION: 'Recette',
      PRODUCTION: 'Production',
      SYSTEM_ADJUSTMENT: 'Système',
    };
    return labels[source] || source;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher dans l'historique..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Movements List */}
      {filteredMovements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {searchQuery ? 'Aucun mouvement trouvé' : 'Aucun mouvement de stock'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMovements.map((movement) => (
            <Card key={movement.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Icon + Product Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-1">{getMovementIcon(movement.movementType)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{movement.product.name}</h3>
                        <Badge variant="outline" className={getMovementColor(movement.movementType)}>
                          {movement.movementType === 'IN' ? '+' : movement.movementType === 'OUT' ? '-' : '±'}
                          {movement.quantity.toFixed(2)} {movement.product.unit}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{movement.reason}</p>
                      {movement.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">
                          {movement.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(movement.movementDate), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {getSourceLabel(movement.source)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Right: Balance */}
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Solde</div>
                    <div className="text-lg font-semibold">
                      {movement.balanceAfter.toFixed(2)}
                      <span className="text-xs text-muted-foreground ml-1">
                        {movement.product.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
