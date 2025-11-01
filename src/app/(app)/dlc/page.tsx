"use client";

import { useState, useEffect } from "react";
import { Calendar, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { CreateButton } from "@/components/CreateButton";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { useLanguage } from "@/providers/LanguageProvider";
import Link from "next/link";

type DlcItem = {
  id: string;
  expirationDate: string;
  quantity: number;
  unit: string;
  status: string;
  batchNumber?: string;
  supplier?: {
    id: string;
    name: string;
  } | null;
  product: {
    id: string;
    name: string;
  };
};

export default function DlcPage() {
  const { t } = useLanguage();
  const [dlcs, setDlcs] = useState<DlcItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "expiring">("active");

  useEffect(() => {
    fetchDlcs();
  }, [filter]);

  const fetchDlcs = async () => {
    try {
      setLoading(true);
      const url = filter === "expiring"
        ? "/api/dlc?filter=upcoming&days=7"
        : "/api/dlc";
      const response = await fetch(url);
      const data = await response.json();

      const dlcArray = Array.isArray(data) ? data : [];

      if (filter === "active") {
        setDlcs(dlcArray.filter((d: DlcItem) => d.status === "ACTIVE"));
      } else {
        setDlcs(dlcArray);
      }
    } catch (error) {
      console.error("Error fetching DLCs:", error);
      setDlcs([]);
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

  const getStatusBadge = (dlc: DlcItem) => {
    const days = getDaysUntilExpiration(dlc.expirationDate);

    if (dlc.status === "CONSUMED") {
      return <Badge variant="secondary">{t('dlc.status.consumed')}</Badge>;
    }
    if (dlc.status === "DISCARDED") {
      return <Badge variant="secondary">{t('dlc.status.discarded')}</Badge>;
    }
    if (dlc.status === "EXPIRED" || days <= 0) {
      return <Badge variant="destructive">{t('dlc.status.expired')}</Badge>;
    }
    if (days === 1) {
      return <Badge variant="destructive">{t('dlc.status.tomorrow')}</Badge>;
    }
    if (days <= 3) {
      return <Badge className="bg-orange-500">{t('dlc.status.urgent').replace('{days}', days.toString())}</Badge>;
    }
    if (days <= 7) {
      return <Badge className="bg-yellow-500">{days} {t('dlc.status.days')}</Badge>;
    }
    return <Badge variant="secondary">{days} {t('dlc.status.days')}</Badge>;
  };

  const handleConsumed = async (id: string) => {
    try {
      await fetch(`/api/dlc/${id}/consume`, { method: "POST" });
      fetchDlcs();
    } catch (error) {
      console.error("Error marking as consumed:", error);
    }
  };

  const handleDiscarded = async (id: string) => {
    try {
      await fetch(`/api/dlc/${id}/discard`, { method: "POST" });
      fetchDlcs();
    } catch (error) {
      console.error("Error marking as discarded:", error);
    }
  };

  // Group DLCs by month and year
  const groupDlcsByMonth = (dlcs: DlcItem[]) => {
    const groups: Record<string, DlcItem[]> = {};

    dlcs.forEach(dlc => {
      const date = new Date(dlc.expirationDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(dlc);
    });

    // Sort items within each month by expiration date
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) =>
        new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
      );
    });

    // Sort months chronologically
    return Object.keys(groups)
      .sort()
      .map(monthYear => ({
        monthYear,
        items: groups[monthYear],
      }));
  };

  const getMonthLabel = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const groupedDlcs = groupDlcsByMonth(dlcs);

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <PageHeader
        title={t('dlc.title')}
        subtitle={t('dlc.subtitle')}
        icon={Calendar}
      />

      {/* Notification Prompt */}
      <NotificationPrompt />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === "active" ? "default" : "outline"}
                onClick={() => setFilter("active")}
                className="cursor-pointer flex-1 min-w-[80px] sm:flex-none"
                size="sm"
              >
                {t('dlc.filter.active')}
              </Button>
              <Button
                variant={filter === "expiring" ? "default" : "outline"}
                onClick={() => setFilter("expiring")}
                className="cursor-pointer flex-1 min-w-[80px] sm:flex-none"
                size="sm"
              >
                <AlertTriangle className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">{t('dlc.filter.expiringSoon')}</span>
                <span className="sm:hidden">{t('dlc.expiring')}</span>
              </Button>
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                className="cursor-pointer flex-1 min-w-[80px] sm:flex-none"
                size="sm"
              >
                {t('dlc.filter.all')}
              </Button>
            </div>
            <Link href="/dlc/new" className="w-full sm:w-auto">
              <CreateButton className="w-full sm:w-auto">{t('dlc.addBestBefore')}</CreateButton>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>

          {loading ? (
            <div className="py-8">
              <p className="text-center text-gray-500">{t('dlc.loading')}</p>
            </div>
          ) : dlcs.length === 0 ? (
            <div className="py-8">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">{t('dlc.empty')}</p>
                <Link href="/dlc/new">
                  <CreateButton className="mt-4">{t('dlc.addBestBefore')}</CreateButton>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedDlcs.map((group) => (
                <div key={group.monthYear} className="space-y-3">
                  {/* Month Header */}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold capitalize">
                      {getMonthLabel(group.monthYear)}
                    </h3>
                    <Badge variant="outline" className="ml-auto">
                      {group.items.length} {group.items.length === 1 ? 'produit' : 'produits'}
                    </Badge>
                  </div>

                  {/* DLCs in this month */}
                  <div className="space-y-3 pl-0 sm:pl-8">
                    {group.items.map((dlc) => (
                      <div key={dlc.id} className="border rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex gap-3 sm:gap-4 min-w-0">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold truncate">{dlc.product.name}</h3>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                                <span className="whitespace-nowrap">
                                  {dlc.quantity} {dlc.unit}
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span className="whitespace-nowrap">
                                  {t('dlc.expires')}: {new Date(dlc.expirationDate).toLocaleDateString()}
                                </span>
                                {dlc.batchNumber && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="whitespace-nowrap">{t('dlc.lot')}: {dlc.batchNumber}</span>
                                  </>
                                )}
                                {dlc.supplier && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="whitespace-nowrap">{dlc.supplier.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {getStatusBadge(dlc)}
                            {dlc.status === "ACTIVE" && (
                              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleConsumed(dlc.id)}
                                  className="cursor-pointer text-xs sm:text-sm"
                                >
                                  <span className="hidden sm:inline">{t('dlc.markConsumed')}</span>
                                  <span className="sm:hidden">{t('dlc.consumed')}</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDiscarded(dlc.id)}
                                  className="cursor-pointer text-xs sm:text-sm"
                                >
                                  {t('dlc.discard')}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
