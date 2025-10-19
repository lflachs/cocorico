'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Building2, Plus } from 'lucide-react';
import Link from 'next/link';
import { BillsList } from './BillsList';
import { SuppliersList } from './SuppliersList';
import { SupplierModal } from './SupplierModal';
import { useLanguage } from '@/providers/LanguageProvider';
import type { Supplier } from '@prisma/client';

type BillsPageContentProps = {
  initialBills: any[];
  initialSuppliers: Supplier[];
};

export function BillsPageContent({ initialBills, initialSuppliers }: BillsPageContentProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('bills');
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers || []);

  useEffect(() => {
    // Refresh suppliers when modal closes
    if (!supplierModalOpen) {
      fetchSuppliers();
    }
  }, [supplierModalOpen]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierModalOpen(true);
  };

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setSupplierModalOpen(true);
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="bills" className="gap-2">
            <FileText className="w-4 h-4" />
            Bills
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Building2 className="w-4 h-4" />
            Suppliers
          </TabsTrigger>
        </TabsList>

        {/* Bills Tab */}
        <TabsContent value="bills" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('bills.recentBills')}
                  </CardTitle>
                  <CardDescription>{t('bills.recentBills.description')}</CardDescription>
                </div>
                <Link href="/bills/upload">
                  <Button className="gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {t('bills.uploadNew')}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!initialBills || initialBills.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">{t('bills.empty')}</p>
                  <p className="text-sm mt-2">{t('bills.empty.hint')}</p>
                  <Link href="/bills/upload">
                    <Button className="mt-4 cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {t('bills.uploadFirst')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <BillsList bills={initialBills} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Suppliers
                  </CardTitle>
                  <CardDescription>Manage your supplier contacts and information</CardDescription>
                </div>
                <Button onClick={handleCreateSupplier} className="gap-2 cursor-pointer">
                  <Plus className="w-4 h-4" />
                  Add Supplier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SuppliersList suppliers={suppliers} onEdit={handleEditSupplier} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Supplier Modal */}
      <SupplierModal
        open={supplierModalOpen}
        onOpenChange={setSupplierModalOpen}
        supplier={selectedSupplier}
      />
    </>
  );
}
