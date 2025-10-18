"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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

export function DlcAlerts() {
  const [upcomingDlcs, setUpcomingDlcs] = useState<DlcItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingDlcs();
  }, []);

  const fetchUpcomingDlcs = async () => {
    try {
      const response = await fetch("/api/dlc?filter=upcoming&days=7");
      const data = await response.json();
      setUpcomingDlcs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching upcoming DLCs:", error);
      setUpcomingDlcs([]);
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

  const getUrgencyColor = (days: number) => {
    if (days <= 0) return "text-red-600 bg-red-50";
    if (days <= 2) return "text-orange-600 bg-orange-50";
    if (days <= 5) return "text-yellow-600 bg-yellow-50";
    return "text-blue-600 bg-blue-50";
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 0) return <Badge variant="destructive">Expired</Badge>;
    if (days === 1) return <Badge variant="destructive">Tomorrow</Badge>;
    if (days <= 2) return <Badge className="bg-orange-500">Urgent</Badge>;
    return <Badge variant="secondary">{days} days</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Expiration Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (upcomingDlcs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Expiration Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No products expiring in the next 7 days
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Expiration Alerts ({upcomingDlcs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingDlcs.map((dlc) => {
            const days = getDaysUntilExpiration(dlc.expirationDate);
            return (
              <div
                key={dlc.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getUrgencyColor(
                  days
                )}`}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4" />
                  <div>
                    <p className="font-medium text-sm">
                      {dlc.product.name}
                    </p>
                    <p className="text-xs opacity-75">
                      {dlc.quantity} {dlc.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getUrgencyBadge(days)}
                </div>
              </div>
            );
          })}
        </div>
        <Link
          href="/dlc"
          className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all dates →
        </Link>
      </CardContent>
    </Card>
  );
}
