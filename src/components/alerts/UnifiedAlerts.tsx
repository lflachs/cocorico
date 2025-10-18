"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Package, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";

type DlcItem = {
  id: string;
  expirationDate: string;
  quantity: number;
  unit: string;
  product: {
    id: string;
    name: string;
  };
};

type LowStockItem = {
  id: string;
  name: string;
  quantity: number;
  parLevel: number;
  unit: string;
};

type DisputeItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  bill: {
    supplier: string | null;
  };
};

type Alert = {
  id: string;
  type: 'expiring' | 'lowStock' | 'dispute';
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  href: string;
  icon: any;
  badge?: string;
};

export function UnifiedAlerts() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const [dlcRes, productsRes, disputesRes] = await Promise.all([
        fetch("/api/dlc?filter=upcoming&days=7"),
        fetch("/api/products"),
        fetch("/api/disputes?status=open"),
      ]);

      const dlcs = await dlcRes.json();
      const products = await productsRes.json();
      const disputes = await disputesRes.json();

      const allAlerts: Alert[] = [];

      // Process expiring products
      if (Array.isArray(dlcs)) {
        dlcs.forEach((dlc: DlcItem) => {
          const days = getDaysUntilExpiration(dlc.expirationDate);
          let urgency: 'high' | 'medium' | 'low' = 'low';
          let badge = '';

          if (days <= 0) {
            urgency = 'high';
            badge = t('dlc.status.expired');
          } else if (days === 1) {
            urgency = 'high';
            badge = t('dlc.status.tomorrow');
          } else if (days <= 2) {
            urgency = 'high';
            badge = `${days} ${t('dlc.status.days')}`;
          } else if (days <= 5) {
            urgency = 'medium';
            badge = `${days} ${t('dlc.status.days')}`;
          } else {
            urgency = 'low';
            badge = `${days} ${t('dlc.status.days')}`;
          }

          allAlerts.push({
            id: `dlc-${dlc.id}`,
            type: 'expiring',
            title: dlc.product.name,
            description: `${dlc.quantity} ${dlc.unit}`,
            urgency,
            href: '/dlc',
            icon: Clock,
            badge,
          });
        });
      }

      // Process low stock items
      if (Array.isArray(products)) {
        products.forEach((product: any) => {
          if (product.parLevel && product.quantity < product.parLevel) {
            const shortage = product.parLevel - product.quantity;
            const percentShort = (shortage / product.parLevel) * 100;

            let urgency: 'high' | 'medium' | 'low' = 'medium';
            if (percentShort >= 80) urgency = 'high';
            else if (percentShort >= 50) urgency = 'medium';
            else urgency = 'low';

            allAlerts.push({
              id: `stock-${product.id}`,
              type: 'lowStock',
              title: product.name,
              description: `${product.quantity} / ${product.parLevel} ${product.unit}`,
              urgency,
              href: '/inventory',
              icon: Package,
              badge: t('inventory.status.low'),
            });
          }
        });
      }

      // Process ongoing disputes
      if (Array.isArray(disputes)) {
        disputes.forEach((dispute: DisputeItem) => {
          const daysSince = getDaysSince(dispute.createdAt);
          let urgency: 'high' | 'medium' | 'low' = 'medium';

          if (daysSince >= 7) urgency = 'high';
          else if (daysSince >= 3) urgency = 'medium';
          else urgency = 'low';

          allAlerts.push({
            id: `dispute-${dispute.id}`,
            type: 'dispute',
            title: dispute.title,
            description: dispute.bill.supplier || t('disputes.noSupplier') || 'Unknown supplier',
            urgency,
            href: '/disputes',
            icon: AlertCircle,
            badge: `${daysSince} ${t('dlc.status.days')}`,
          });
        });
      }

      // Sort by urgency
      allAlerts.sort((a, b) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });

      setAlerts(allAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const now = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (urgency: 'high' | 'medium' | 'low', type: string) => {
    if (urgency === 'high') {
      // High urgency: use destructive (red) for critical items
      return type === 'expiring' ? 'bg-destructive/5 border-destructive/20' :
             type === 'lowStock' ? 'bg-warning/10 border-warning/30' :
             'bg-destructive/5 border-destructive/20';
    }
    if (urgency === 'medium') {
      // Medium urgency: use warning (amber)
      return 'bg-warning/10 border-warning/30';
    }
    // Low urgency: use muted colors
    return 'bg-muted/50 border-border';
  };

  const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low', badge: string) => {
    if (urgency === 'high') {
      return <Badge variant="destructive" className="text-xs">{badge}</Badge>;
    }
    if (urgency === 'medium') {
      return <Badge className="bg-warning text-warning-foreground text-xs">{badge}</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{badge}</Badge>;
  };

  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'expiring': return Clock;
      case 'lowStock': return Package;
      case 'dispute': return AlertCircle;
      default: return AlertTriangle;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('today.alerts.title') || 'Alerts'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('today.quickSales.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  // Count alerts by type
  const expiringCount = alerts.filter(a => a.type === 'expiring').length;
  const lowStockCount = alerts.filter(a => a.type === 'lowStock').length;
  const disputesCount = alerts.filter(a => a.type === 'dispute').length;

  // Filter alerts based on active tab
  const filteredAlerts = activeTab === 'all'
    ? alerts
    : alerts.filter(a => a.type === activeTab);

  const renderAlertsList = (alertsToRender: Alert[]) => {
    if (alertsToRender.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            {t('today.alerts.noAlertsInCategory') || 'No alerts in this category'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {alertsToRender.map((alert) => {
          const Icon = alert.icon;
          return (
            <Link
              key={alert.id}
              href={alert.href}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${getUrgencyColor(
                alert.urgency,
                alert.type
              )}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  alert.urgency === 'high' ? 'bg-white' : 'bg-white/50'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    alert.type === 'expiring' && alert.urgency === 'high' ? 'text-destructive' :
                    alert.type === 'lowStock' ? 'text-warning' :
                    alert.type === 'dispute' && alert.urgency === 'high' ? 'text-destructive' :
                    'text-primary'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {alert.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {alert.badge && getUrgencyBadge(alert.urgency, alert.badge)}
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-br from-success/5 via-transparent to-transparent">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-success" />
            {t('today.alerts.title') || 'Alerts'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-foreground font-medium">
              {t('today.alerts.allClear') || 'All clear! No alerts at the moment.'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('today.alerts.allClearHint') || 'Everything is running smoothly'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-br from-warning/5 via-transparent to-transparent">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          {t('today.alerts.title') || 'Alerts'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <span>{t('today.alerts.all') || 'All'}</span>
              {alerts.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                  {alerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="expiring" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="hidden sm:inline">{t('today.alerts.expiring') || 'Expiring'}</span>
              {expiringCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                  {expiringCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="lowStock" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span className="hidden sm:inline">{t('today.alerts.stock') || 'Stock'}</span>
              {lowStockCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                  {lowStockCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dispute" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span className="hidden sm:inline">{t('today.alerts.disputes') || 'Disputes'}</span>
              {disputesCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                  {disputesCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderAlertsList(filteredAlerts)}
          </TabsContent>

          <TabsContent value="expiring">
            {renderAlertsList(filteredAlerts)}
          </TabsContent>

          <TabsContent value="lowStock">
            {renderAlertsList(filteredAlerts)}
          </TabsContent>

          <TabsContent value="dispute">
            {renderAlertsList(filteredAlerts)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
