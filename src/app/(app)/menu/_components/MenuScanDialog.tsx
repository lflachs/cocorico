'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { toast } from 'sonner';

type ScannedDish = {
  name: string;
  description: string | null;
  price: number | null;
};

type ScannedSection = {
  name: string;
  dishes: ScannedDish[];
};

type ScannedMenu = {
  menuName: string;
  menuDescription: string | null;
  pricingType: 'PRIX_FIXE' | 'CHOICE';
  fixedPrice: number | null;
  minCourses: number | null;
  maxCourses: number | null;
  sections: ScannedSection[];
};

type AlaCarteDish = {
  name: string;
  description: string | null;
  price: number;
  category: string | null;
};

type ScannedMenuData = {
  menus: ScannedMenu[];
  alacarte: AlaCarteDish[];
  confidence: number;
  extractedText?: string;
};

type MenuScanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMenuScanned: (menuData: ScannedMenu) => void;
};

export function MenuScanDialog({ open, onOpenChange, onMenuScanned }: MenuScanDialogProps) {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedMenuData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMenus, setSelectedMenus] = useState<Set<number>>(new Set());
  const [selectedAlacarte, setSelectedAlacarte] = useState<Set<number>>(new Set());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setScannedData(null);
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/menu/scan', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to scan menu');
      }

      if (result.success && result.data) {
        // Filter out à la carte dishes that are duplicates of menu dishes
        const menuDishNames = new Set<string>();
        result.data.menus.forEach((menu) => {
          menu.sections.forEach((section) => {
            section.dishes.forEach((dish) => {
              menuDishNames.add(dish.name.toLowerCase().trim());
            });
          });
        });

        // Remove duplicates from alacarte
        const uniqueAlacarte = result.data.alacarte.filter(
          (dish) => !menuDishNames.has(dish.name.toLowerCase().trim())
        );

        setScannedData({
          ...result.data,
          alacarte: uniqueAlacarte,
        });

        // Select all menus by default
        setSelectedMenus(new Set(result.data.menus.map((_, idx) => idx)));
        // Don't select alacarte by default (optional)
        setSelectedAlacarte(new Set());

        const menuCount = result.data.menus.length;
        const alacarteCount = uniqueAlacarte.length;
        const removedDuplicates = (result.data.alacarte?.length || 0) - alacarteCount;

        let message = `Found ${menuCount} menu(s) and ${alacarteCount} à la carte dish(es)!`;
        if (removedDuplicates > 0) {
          message += ` (${removedDuplicates} duplicate(s) removed)`;
        }
        toast.success(message);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan menu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setScanning(false);
    }
  };

  const handleImport = async () => {
    if (!scannedData || (selectedMenus.size === 0 && selectedAlacarte.size === 0)) return;

    try {
      // Import selected menus one by one
      const menusToImport = Array.from(selectedMenus).map(idx => scannedData.menus[idx]);
      for (const menu of menusToImport) {
        await onMenuScanned(menu);
      }

      // Import selected à la carte dishes as standalone dishes
      if (selectedAlacarte.size > 0) {
        const alacarteDishes = Array.from(selectedAlacarte).map(idx => scannedData.alacarte[idx]);
        const { createDish } = await import('@/lib/services/dish.service');

        for (const dish of alacarteDishes) {
          await createDish({
            name: dish.name,
            description: dish.description || undefined,
            sellingPrice: dish.price,
            isActive: true,
          });
        }

        if (alacarteDishes.length > 0) {
          toast.success(`Imported ${alacarteDishes.length} à la carte dish(es)`);
        }
      }

      handleClose();
    } catch (error) {
      console.error('Error importing:', error);
      toast.error('Failed to import some items');
    }
  };

  const toggleMenuSelection = (index: number) => {
    const newSelection = new Set(selectedMenus);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedMenus(newSelection);
  };

  const toggleAlacarteSelection = (index: number) => {
    const newSelection = new Set(selectedAlacarte);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedAlacarte(newSelection);
  };

  const handleClose = () => {
    setFile(null);
    setScannedData(null);
    setError(null);
    setScanning(false);
    setSelectedMenus(new Set());
    setSelectedAlacarte(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            {t('menu.scanMenu') || 'Scan Menu'}
          </DialogTitle>
          <DialogDescription>
            {t('menu.scanMenuDescription') ||
              'Upload a photo or PDF of your menu to automatically extract dishes and sections'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={scanning}
                className="flex-1"
              />
              <Button onClick={handleScan} disabled={!file || scanning} className="gap-2">
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('menu.scanning') || 'Scanning...'}
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    {t('menu.scan') || 'Scan'}
                  </>
                )}
              </Button>
            </div>

            {file && (
              <div className="text-sm text-muted-foreground">
                <Upload className="w-4 h-4 inline mr-2" />
                {file.name}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-destructive">
                  <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Scanning failed</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scanned Results */}
          {scannedData && (
            <div className="space-y-4">
              <Card className="border-success">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    Scan Complete
                  </CardTitle>
                  <div className="text-sm text-muted-foreground mt-2">
                    Confidence: {Math.round(scannedData.confidence * 100)}%
                    {scannedData.menus.length > 0 && ` • ${scannedData.menus.length} menu(s)`}
                    {scannedData.alacarte.length > 0 && ` • ${scannedData.alacarte.length} à la carte dish(es)`}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Menu List */}
                  {scannedData.menus.length > 0 && (
                    <>
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg">Menus</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Select menus to import
                        </p>
                      </div>
                      {scannedData.menus.map((menu, menuIdx) => (
                    <Card
                      key={menuIdx}
                      className={`cursor-pointer transition-all ${
                        selectedMenus.has(menuIdx)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleMenuSelection(menuIdx)}
                    >
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedMenus.has(menuIdx)}
                            onChange={() => toggleMenuSelection(menuIdx)}
                            className="mt-1 h-5 w-5 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg">{menu.menuName}</CardTitle>
                            {menu.menuDescription && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {menu.menuDescription}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-3 text-sm">
                              <div>
                                <span className="font-semibold">Type:</span>{' '}
                                {menu.pricingType === 'PRIX_FIXE' ? 'Prix Fixe' : 'Choice Menu'}
                              </div>
                              {menu.fixedPrice && (
                                <div>
                                  <span className="font-semibold">Price:</span> €{menu.fixedPrice}
                                </div>
                              )}
                              {menu.pricingType === 'CHOICE' && menu.minCourses && menu.maxCourses && (
                                <div>
                                  <span className="font-semibold">Courses:</span> Choose{' '}
                                  {menu.minCourses === menu.maxCourses
                                    ? menu.minCourses
                                    : `${menu.minCourses}-${menu.maxCourses}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm font-semibold">
                            {menu.sections.length} Section(s)
                          </div>
                          {menu.sections.map((section, sectionIdx) => (
                            <div key={sectionIdx} className="border-l-2 border-primary/30 pl-3">
                              <div className="font-medium text-sm mb-2">{section.name}</div>
                              <div className="space-y-1">
                                {section.dishes.map((dish, dishIdx) => (
                                  <div key={dishIdx} className="text-sm text-muted-foreground pl-2">
                                    • {dish.name}
                                    {dish.price && <span className="ml-2">€{dish.price}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                      ))}
                    </>
                  )}

                  {/* À La Carte Dishes */}
                  {scannedData.alacarte && scannedData.alacarte.length > 0 && (
                    <div className={scannedData.menus.length > 0 ? "mt-6 pt-6 border-t" : ""}>
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg">À La Carte Dishes (Optional)</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Select individual dishes to add to your dish library
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {scannedData.alacarte.map((dish, dishIdx) => (
                          <div
                            key={dishIdx}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedAlacarte.has(dishIdx)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => toggleAlacarteSelection(dishIdx)}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedAlacarte.has(dishIdx)}
                                onChange={() => toggleAlacarteSelection(dishIdx)}
                                className="mt-0.5 h-4 w-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{dish.name}</div>
                                {dish.description && (
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {dish.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-xs">
                                  <span className="font-semibold text-primary">€{dish.price}</span>
                                  {dish.category && (
                                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                      {dish.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {selectedMenus.size} menu(s) and {selectedAlacarte.size} dish(es) selected
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleClose}>
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={selectedMenus.size === 0 && selectedAlacarte.size === 0}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('menu.importMenu') || 'Import'} ({selectedMenus.size + selectedAlacarte.size})
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
