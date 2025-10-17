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
import { Plus, Minus } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { toast } from 'sonner';

/**
 * Sale Record Dialog
 * Modal for recording dish sales with quantity selector
 */

type Dish = {
  id: string;
  name: string;
};

type SaleRecordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish: Dish;
  onSuccess: () => void;
};

export function SaleRecordDialog({ open, onOpenChange, dish, onSuccess }: SaleRecordDialogProps) {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call when sales endpoint is ready
      // await fetch('/api/sales', {
      //   method: 'POST',
      //   body: JSON.stringify({ dishId: dish.id, quantity }),
      // });
      onSuccess();
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error('Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('today.saleDialog.title')}</DialogTitle>
          <DialogDescription>{t('today.saleDialog.recordingFor')} {dish.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>

            <div className="text-4xl font-bold w-20 text-center">{quantity}</div>

            <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                setQuantity(1);
              }}
            >
              {t('today.saleDialog.cancel')}
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? t('today.saleDialog.recording') : t('today.saleDialog.confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
