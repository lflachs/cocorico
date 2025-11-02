'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type ProductionHistoryItem = {
  id: string;
  dishId: string;
  dishName: string;
  quantityProduced: number;
  productionDate: Date;
  notes?: string | null;
};

type ProductionHistoryCardProps = {
  productions: ProductionHistoryItem[];
};

export function ProductionHistoryCard({ productions }: ProductionHistoryCardProps) {
  if (productions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Historique de production
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune production récente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Historique de production
          <Badge variant="secondary" className="ml-auto">
            {productions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {productions.map((production) => (
            <div
              key={production.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {production.dishName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(production.productionDate), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                    {production.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {production.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {production.quantityProduced}x
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
