'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Scan, Plus, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/providers/LanguageProvider';
import { toast } from 'sonner';

/**
 * Add Menu Page
 * Choose between scanning a menu or manually creating one
 */

export default function AddMenuPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showScanUpload, setShowScanUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [suggestIngredients, setSuggestIngredients] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setScanning(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('suggestIngredients', suggestIngredients.toString());

      const response = await fetch('/api/menu/scan', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to scan menu');
      }

      if (result.success && result.data) {
        // Save to sessionStorage and redirect to review page
        sessionStorage.setItem('scannedMenuData', JSON.stringify(result.data));
        router.push('/menu/scan-review');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan menu';
      toast.error(errorMessage);
    } finally {
      setScanning(false);
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

      {!showScanUpload ? (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Scan Menu Option */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowScanUpload(true)}>
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
        </>
      ) : (
        /* Scan Upload Section */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="w-5 h-5" />
                  {t('menu.scanMenu')}
                </CardTitle>
                <CardDescription>
                  {t('menu.scanMenuDescription')}
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => {
                setShowScanUpload(false);
                setFile(null);
              }}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={scanning}
              />

              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" />
                  {file.name}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="suggestIngredients"
                checked={suggestIngredients}
                onChange={(e) => setSuggestIngredients(e.target.checked)}
                disabled={scanning}
                className="h-4 w-4 cursor-pointer"
              />
              <label
                htmlFor="suggestIngredients"
                className="text-sm font-medium text-blue-900 cursor-pointer"
              >
                Suggest ingredients automatically (AI-powered)
              </label>
            </div>
            {suggestIngredients && (
              <p className="text-xs text-muted-foreground">
                We'll try to match dishes with products in your inventory and suggest quantities. You can review and adjust before importing.
              </p>
            )}

            <Button
              onClick={handleScan}
              disabled={!file || scanning}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('menu.scanning') || 'Scanning...'}
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 mr-2" />
                  {t('menu.scan') || 'Scan & Continue'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
