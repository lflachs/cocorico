'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scan, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MenuScanDialog } from '../_components/MenuScanDialog';
import { useLanguage } from '@/providers/LanguageProvider';
import { toast } from 'sonner';

/**
 * Add Menu Page
 * Choose between scanning a menu or manually creating one
 */

export default function AddMenuPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showScanDialog, setShowScanDialog] = useState(false);

  const handleMenuScanned = async (scannedData: any) => {
    try {
      const { importScannedMenuAction } = await import('@/lib/actions/menu.actions');
      const result = await importScannedMenuAction(scannedData);

      if (result.success) {
        toast.success('Menu imported successfully!');
        setShowScanDialog(false);
        router.push('/menu');
      } else {
        toast.error(result.error || 'Failed to import menu');
      }
    } catch (error) {
      console.error('Error importing menu:', error);
      toast.error('Failed to import menu');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href="/menu">
          <Button variant="ghost" className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('menu.backToMenus')}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {t('menu.createMenu')}
        </h1>
        <p className="mt-2 text-gray-600">{t('menu.new.chooseMethod') || 'Choose how you want to create your menu'}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scan Menu Option */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowScanDialog(true)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <Scan className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>{t('menu.scanMenu')}</CardTitle>
                <CardDescription>{t('menu.new.scanDescription') || 'Upload menu photo or PDF'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {t('menu.scanMenuDescription')}
            </p>
            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
              <Scan className="w-4 h-4 mr-2" />
              {t('menu.scanMenu')}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Entry Option */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/menu/create')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>{t('menu.new.manualEntry') || 'Manual Entry'}</CardTitle>
                <CardDescription>{t('menu.new.manualDescription') || 'Create menu manually'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {t('menu.new.manualDescriptionLong') || 'Manually create your menu with sections and dishes. Best for customized menus with specific organization.'}
            </p>
            <Button variant="outline" className="w-full mt-4">
              <Plus className="w-4 h-4 mr-2" />
              {t('menu.new.createManually') || 'Create Manually'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 {t('menu.new.tipTitle') || 'Tip'}</h3>
          <p className="text-sm text-blue-800">
            {t('menu.new.tipContent') || 'Scanning a menu automatically extracts dishes and sections, saving you time. You can always edit the details after importing.'}
          </p>
        </CardContent>
      </Card>

      {/* Scan Menu Dialog */}
      <MenuScanDialog
        open={showScanDialog}
        onOpenChange={setShowScanDialog}
        onMenuScanned={handleMenuScanned}
      />
    </div>
  );
}
