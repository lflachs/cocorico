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
          <p className="text-muted-foreground py-8 text-center text-sm">
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
      <CardContent className="max-h-[60vh] overflow-y-auto">
        <div className="space-y-3">
          {productions.map((production) => (
            <div
              key={production.id}
              className="bg-card hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 transition-colors overflow-hidden"
            >
              <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                <Package className="text-primary h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-sm font-medium line-clamp-2 break-words">{production.dishName}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(production.productionDate), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                    {production.notes && (
                      <p className="text-muted-foreground mt-1 text-xs italic">
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
