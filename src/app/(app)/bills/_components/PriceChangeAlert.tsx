'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type PriceChangeInfo = {
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  purchasePrice: number;
  changePercent: number;
  currentQuantity: number;
  purchaseQuantity: number;
  newTotalQuantity: number;
};

type Props = {
  priceChanges: PriceChangeInfo[];
};

export function PriceChangeAlert({ priceChanges }: Props) {
  if (priceChanges.length === 0) return null;

  // Categorize changes by severity
  const significantChanges = priceChanges.filter((p) => Math.abs(p.changePercent) >= 10);
  const moderateChanges = priceChanges.filter(
    (p) => Math.abs(p.changePercent) >= 5 && Math.abs(p.changePercent) < 10
  );
  const minorChanges = priceChanges.filter((p) => Math.abs(p.changePercent) < 5);

  const getSeverityColor = (changePercent: number) => {
    const abs = Math.abs(changePercent);
    if (abs >= 10) return 'border-red-300 bg-red-50';
    if (abs >= 5) return 'border-orange-300 bg-orange-50';
    return 'border-blue-300 bg-blue-50';
  };

  const getTextColor = (changePercent: number) => {
    const abs = Math.abs(changePercent);
    if (abs >= 10) return 'text-red-900';
    if (abs >= 5) return 'text-orange-900';
    return 'text-blue-900';
  };

  const getBadgeVariant = (changePercent: number) => {
    if (changePercent > 0) return 'destructive';
    return 'default';
  };

  return (
    <Card className="border-yellow-300 bg-yellow-50">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-yellow-900">
              Price Changes Detected
            </CardTitle>
            <CardDescription className="text-yellow-700">
              {priceChanges.length} product{priceChanges.length > 1 ? 's have' : ' has'} price
              changes. New prices calculated using weighted averages.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info box explaining weighted averages */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-900">
            <strong>How it works:</strong> When receiving new stock at a different price, we calculate
            a weighted average. Example: 2kg at €2.00 + 4kg at €2.10 = 6kg at €2.07/kg average.
          </p>
        </div>

        {/* Significant changes (≥10%) */}
        {significantChanges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Significant Changes (≥10%)
            </h4>
            <div className="space-y-2">
              {significantChanges.map((change) => (
                <PriceChangeCard key={change.productId} change={change} />
              ))}
            </div>
          </div>
        )}

        {/* Moderate changes (5-10%) */}
        {moderateChanges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Moderate Changes (5-10%)
            </h4>
            <div className="space-y-2">
              {moderateChanges.map((change) => (
                <PriceChangeCard key={change.productId} change={change} />
              ))}
            </div>
          </div>
        )}

        {/* Minor changes (<5%) */}
        {minorChanges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Minor Changes (&lt;5%)</h4>
            <div className="space-y-2">
              {minorChanges.map((change) => (
                <PriceChangeCard key={change.productId} change={change} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriceChangeCard({ change }: { change: PriceChangeInfo }) {
  const isIncrease = change.changePercent > 0;
  const Icon = isIncrease ? TrendingUp : TrendingDown;

  const getSeverityColor = (changePercent: number) => {
    const abs = Math.abs(changePercent);
    if (abs >= 10) return 'border-red-200 bg-red-50';
    if (abs >= 5) return 'border-orange-200 bg-orange-50';
    return 'border-blue-200 bg-blue-50';
  };

  const getTextColor = (changePercent: number) => {
    const abs = Math.abs(changePercent);
    if (abs >= 10) return 'text-red-900';
    if (abs >= 5) return 'text-orange-900';
    return 'text-blue-900';
  };

  return (
    <div className={`p-3 border rounded-lg ${getSeverityColor(change.changePercent)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h5 className={`font-semibold text-sm truncate ${getTextColor(change.changePercent)}`}>
              {change.productName}
            </h5>
            <Badge
              variant={isIncrease ? 'destructive' : 'default'}
              className="flex-shrink-0 text-xs"
            >
              {isIncrease ? '+' : ''}
              {change.changePercent.toFixed(1)}%
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {/* Price info */}
            <div>
              <span className="text-gray-600">Previous avg:</span>
              <span className="ml-1 font-medium">€{change.oldPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Bill price:</span>
              <span className="ml-1 font-medium">€{change.purchasePrice.toFixed(2)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">New avg:</span>
              <span className={`ml-1 font-semibold ${getTextColor(change.changePercent)}`}>
                €{change.newPrice.toFixed(2)}
              </span>
            </div>

            {/* Stock info */}
            <div className="col-span-2 mt-1 pt-1 border-t border-current opacity-30" />
            <div>
              <span className="text-gray-600">Current:</span>
              <span className="ml-1">{change.currentQuantity} kg</span>
            </div>
            <div>
              <span className="text-gray-600">Receiving:</span>
              <span className="ml-1">+{change.purchaseQuantity} kg</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">New total:</span>
              <span className="ml-1 font-medium">{change.newTotalQuantity} kg</span>
            </div>
          </div>
        </div>

        <Icon
          className={`w-5 h-5 flex-shrink-0 ${
            isIncrease ? 'text-red-600' : 'text-green-600'
          }`}
        />
      </div>
    </div>
  );
}
