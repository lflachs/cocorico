'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  Package,
  DollarSign,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/providers/LanguageProvider';
import { toast } from 'sonner';

type PriceHistoryRecord = {
  id: string;
  productId: string;
  product: {
    name: string;
    displayName: string | null;
    unit: string;
  };
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  quantityPurchased: number | null;
  changedAt: string;
  bill: {
    filename: string;
    billDate: string | null;
  } | null;
  supplier: {
    name: string;
  } | null;
};

export default function PriceHistoryPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PriceHistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'increases' | 'decreases'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadPriceHistory();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [priceHistory, searchQuery, filterType, startDate, endDate]);

  const loadPriceHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/price-history');
      if (!response.ok) throw new Error('Failed to load price history');

      const data = await response.json();
      setPriceHistory(data);
    } catch (error) {
      console.error('Error loading price history:', error);
      toast.error('Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...priceHistory];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.product.name.toLowerCase().includes(query) ||
          record.product.displayName?.toLowerCase().includes(query) ||
          record.supplier?.name.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType === 'increases') {
      filtered = filtered.filter((record) => record.changePercent > 0);
    } else if (filterType === 'decreases') {
      filtered = filtered.filter((record) => record.changePercent < 0);
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((record) => new Date(record.changedAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      filtered = filtered.filter((record) => new Date(record.changedAt) <= end);
    }

    setFilteredHistory(filtered);
  };

  const calculateStats = () => {
    const increases = priceHistory.filter((r) => r.changePercent > 0).length;
    const decreases = priceHistory.filter((r) => r.changePercent < 0).length;
    const avgChange =
      priceHistory.length > 0
        ? priceHistory.reduce((sum, r) => sum + r.changePercent, 0) / priceHistory.length
        : 0;

    return { increases, decreases, avgChange };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Price History</h1>
        <p className="mt-2 text-gray-600">
          Track all product price changes and weighted average calculations
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Changes</p>
                <p className="text-2xl font-bold">{priceHistory.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Price Increases</p>
                <p className="text-2xl font-bold text-red-600">{stats.increases}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Price Decreases</p>
                <p className="text-2xl font-bold text-green-600">{stats.decreases}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Change</p>
                <p
                  className={`text-2xl font-bold ${
                    stats.avgChange > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {stats.avgChange > 0 ? '+' : ''}
                  {stats.avgChange.toFixed(1)}%
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter price history records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <Label htmlFor="search" className="text-sm">
                Search Product
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Change Type */}
            <div>
              <Label className="text-sm">Change Type</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="flex-1"
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'increases' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('increases')}
                  className="flex-1"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Up
                </Button>
                <Button
                  variant={filterType === 'decreases' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('decreases')}
                  className="flex-1"
                >
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Down
                </Button>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate" className="text-sm">
                From Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="endDate" className="text-sm">
                To Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {(searchQuery || filterType !== 'all' || startDate || endDate) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredHistory.length} of {priceHistory.length} records
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price History List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              {priceHistory.length === 0
                ? 'No price changes recorded yet'
                : 'No records match your filters'}
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((record) => (
            <PriceHistoryCard key={record.id} record={record} />
          ))
        )}
      </div>
    </div>
  );
}

function PriceHistoryCard({ record }: { record: PriceHistoryRecord }) {
  const isIncrease = record.changePercent > 0;
  const Icon = isIncrease ? TrendingUp : TrendingDown;
  const severityClass =
    Math.abs(record.changePercent) >= 10
      ? 'border-red-200 bg-red-50'
      : Math.abs(record.changePercent) >= 5
      ? 'border-orange-200 bg-orange-50'
      : 'border-blue-200 bg-blue-50';

  return (
    <Card className={severityClass}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Product Name */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg truncate">
                {record.product.displayName || record.product.name}
              </h3>
              <Badge variant={isIncrease ? 'destructive' : 'default'}>
                {isIncrease ? '+' : ''}
                {record.changePercent.toFixed(1)}%
              </Badge>
            </div>

            {/* Price Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <div>
                <p className="text-gray-600">Previous Avg</p>
                <p className="font-semibold">€{record.oldPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">New Avg</p>
                <p className={`font-semibold ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                  €{record.newPrice.toFixed(2)}
                </p>
              </div>
              {record.quantityPurchased && (
                <div>
                  <p className="text-gray-600">Quantity</p>
                  <p className="font-medium">
                    {record.quantityPurchased} {record.product.unit}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Change</p>
                <p className={`font-semibold ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                  {isIncrease ? '+' : ''}€
                  {(record.newPrice - record.oldPrice).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              {record.bill && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {record.bill.billDate
                      ? new Date(record.bill.billDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              )}
              {record.supplier && (
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>{record.supplier.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Recorded {new Date(record.changedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Icon
            className={`w-6 h-6 flex-shrink-0 ${isIncrease ? 'text-red-600' : 'text-green-600'}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
