'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Package,
  AlertTriangle,
  FileText,
  Clock,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/providers/LanguageProvider';

/**
 * Today Dashboard - Main dashboard with stats and quick actions
 */

type DashboardStats = {
  totalProducts: number;
  lowStockCount: number;
  expiringCount: number;
  recentBillsCount: number;
};

export function TodayDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockCount: 0,
    expiringCount: 0,
    recentBillsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [productsRes, dlcRes, billsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/dlc?filter=upcoming&days=7'),
        fetch('/api/bills'),
      ]);

      const products = await productsRes.json();
      const dlcs = await dlcRes.json();
      const bills = await billsRes.json();

      // Count low stock items (below par level)
      const lowStock = Array.isArray(products)
        ? products.filter((p: any) => p.parLevel && p.quantity < p.parLevel).length
        : 0;

      setStats({
        totalProducts: Array.isArray(products) ? products.length : 0,
        lowStockCount: lowStock,
        expiringCount: Array.isArray(dlcs) ? dlcs.length : 0,
        recentBillsCount: Array.isArray(bills) ? bills.length : 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('inventory.title'),
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-primary',
      gradient: 'from-primary/90 to-primary',
      href: '/inventory',
    },
    {
      title: t('today.lowStock.title'),
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? 'bg-warning' : 'bg-success',
      gradient: stats.lowStockCount > 0 ? 'from-warning/90 to-warning' : 'from-success/90 to-success',
      href: '/inventory',
      alert: stats.lowStockCount > 0,
    },
    {
      title: t('dlc.filter.expiringSoon'),
      value: stats.expiringCount,
      icon: Clock,
      color: stats.expiringCount > 0 ? 'bg-destructive' : 'bg-success',
      gradient: stats.expiringCount > 0 ? 'from-destructive/90 to-destructive' : 'from-success/90 to-success',
      href: '/dlc',
      alert: stats.expiringCount > 0,
    },
    {
      title: t('bills.title'),
      value: stats.recentBillsCount,
      icon: FileText,
      color: 'bg-secondary',
      gradient: 'from-secondary/90 to-secondary',
      href: '/bills',
    },
  ];


  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link key={stat.title} href={stat.href} className="group">
            <Card className="h-full transition-all hover:shadow-xl cursor-pointer border border-border hover:border-primary/20 bg-white shadow-md hover:-translate-y-0.5">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between flex-1">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className={`text-3xl font-bold ${stat.alert ? 'text-warning' : 'text-foreground'}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-lg shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  <span>{t('common.view') || 'View'}</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
