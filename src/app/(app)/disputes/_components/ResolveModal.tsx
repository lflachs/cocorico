'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

/**
 * Resolve Modal - Resolve disputes and process returns
 */

type DisputeProduct = {
  id: string;
  productId: string;
  reason: string;
  quantityDisputed: number | null;
  product: {
    id: string;
    name: string;
    unit: string;
  };
};

type Dispute = {
  id: string;
  type: string;
  title: string;
  products: DisputeProduct[];
};

type ResolveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: Dispute;
  onSuccess: () => void;
};

export function ResolveModal({ open, onOpenChange, dispute, onSuccess }: ResolveModalProps) {
  const [loading, setLoading] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [productReturns, setProductReturns] = useState<
    Record<string, { quantityReturned: number }>
  >({});

  const handleQuantityChange = (productId: string, quantity: number) => {
    setProductReturns({
      ...productReturns,
      [productId]: { quantityReturned: quantity },
    });
  };

  const handleSubmit = async () => {
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }

    setLoading(true);
    try {
      // Convert productReturns to array format
      const productReturnsArray = Object.entries(productReturns)
        .filter(([_, data]) => data.quantityReturned > 0)
        .map(([productId, data]) => ({
          productId,
          quantityReturned: data.quantityReturned,
        }));

      const response = await fetch(`/api/disputes/${dispute.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionNotes,
          productReturns: productReturnsArray.length > 0 ? productReturnsArray : undefined,
        }),
      });

      if (response.ok) {
        toast.success('Dispute resolved successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to resolve dispute');
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Resolve Dispute: {dispute.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resolution Notes */}
          <div>
            <Label htmlFor="notes">Resolution Notes *</Label>
            <Textarea
              id="notes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how this dispute was resolved (e.g., refund issued, replacement sent, etc.)"
              rows={4}
            />
          </div>

          {/* Product Returns (if applicable) */}
          {dispute.products.length > 0 && dispute.type === 'RETURN' && (
            <div className="space-y-3">
              <Label>Product Returns</Label>
              <p className="text-sm text-gray-600">
                Specify quantities being returned. Stock will be reduced accordingly.
              </p>

              {dispute.products.map((dp) => (
                <div key={dp.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{dp.product.name}</div>
                      <div className="text-sm text-gray-600">
                        Reason: {dp.reason}
                        {dp.quantityDisputed && ` • Disputed: ${dp.quantityDisputed} ${dp.product.unit}`}
                      </div>
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`qty-${dp.productId}`} className="text-xs">
                        Qty Returned
                      </Label>
                      <Input
                        id={`qty-${dp.productId}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={productReturns[dp.productId]?.quantityReturned || ''}
                        onChange={(e) =>
                          handleQuantityChange(
                            dp.productId,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">{dp.product.unit}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Entering quantities will reduce stock levels and
                  create stock movement records for these returns.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={loading || !resolutionNotes.trim()}
            >
              {loading ? 'Resolving...' : 'Resolve Dispute'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
