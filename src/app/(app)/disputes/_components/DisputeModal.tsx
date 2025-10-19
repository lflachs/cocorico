'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

/**
 * Dispute Modal - Create new disputes
 */

type Bill = {
  id: string;
  filename: string;
  supplier: string | null;
  billDate: string | null;
  totalAmount: number | null;
};

type Product = {
  id: string;
  name: string;
  unit: string;
  unitPrice?: number;
};

type BillProduct = {
  id: string;
  productId: string | null;
  product?: {
    id: string;
    name: string;
    unit: string;
  } | null;
  quantityExtracted: number;
  unitPriceExtracted: number | null;
};

type DisputeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preFillBillId?: string;
  preFillBillProducts?: BillProduct[];
};

export function DisputeModal({ open, onOpenChange, onSuccess, preFillBillId, preFillBillProducts }: DisputeModalProps) {
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedBillId, setSelectedBillId] = useState('');
  const [type, setType] = useState<'RETURN' | 'COMPLAINT' | 'REFUND'>('COMPLAINT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountDisputed, setAmountDisputed] = useState('');
  const [isManualAmount, setIsManualAmount] = useState(false);

  // Product dispute fields
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productReason, setProductReason] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [disputedProducts, setDisputedProducts] = useState<
    Array<{
      productId: string;
      productName: string;
      reason: string;
      quantityDisputed?: number;
      unitPrice?: number;
      totalPrice?: number;
      description?: string;
    }>
  >([]);

  useEffect(() => {
    if (open) {
      loadBills();
      loadProducts();
      // Reset form or pre-fill with bill data
      setSelectedBillId(preFillBillId || '');
      setType('COMPLAINT');
      setTitle('');
      setDescription('');
      setAmountDisputed('');

      // Pre-fill disputed products from bill products if provided
      if (preFillBillProducts && preFillBillProducts.length > 0) {
        const prefilled = preFillBillProducts
          .filter(bp => bp.productId && bp.product)
          .map(bp => {
            const unitPrice = bp.unitPriceExtracted || 0;
            const quantity = bp.quantityExtracted || 0;
            return {
              productId: bp.productId!,
              productName: bp.product!.name,
              reason: 'Issue with product',
              quantityDisputed: quantity,
              unitPrice: unitPrice,
              totalPrice: quantity * unitPrice,
              description: undefined,
            };
          });
        setDisputedProducts(prefilled);
      } else {
        setDisputedProducts([]);
      }
      setIsManualAmount(false);
    }
  }, [open, preFillBillId, preFillBillProducts]);

  // Auto-calculate total disputed amount from products
  useEffect(() => {
    if (!isManualAmount && disputedProducts.length > 0) {
      const total = disputedProducts.reduce((sum, product) => {
        return sum + (product.totalPrice || 0);
      }, 0);
      setAmountDisputed(total > 0 ? total.toFixed(2) : '');
    }
  }, [disputedProducts, isManualAmount]);

  // Filter products to only show those from the bill when pre-filled
  const availableProducts = preFillBillProducts && preFillBillProducts.length > 0
    ? products.filter(p => preFillBillProducts.some(bp => bp.productId === p.id))
    : products;

  const loadBills = async () => {
    try {
      const response = await fetch('/api/bills');
      const data = await response.json();
      setBills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading bills:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { getProductsAction } = await import('@/lib/actions/product.actions');
      const result = await getProductsAction();
      if (result.success && result.data) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductId || !productReason) {
      toast.error('Please select a product and provide a reason');
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    // Try to get unit price from bill products first (more accurate)
    const billProduct = preFillBillProducts?.find(bp => bp.productId === selectedProductId);
    const unitPrice = billProduct?.unitPriceExtracted || product.unitPrice || 0;

    const quantity = productQuantity ? parseFloat(productQuantity) : (billProduct?.quantityExtracted || 1);
    const totalPrice = quantity * unitPrice;

    setDisputedProducts([
      ...disputedProducts,
      {
        productId: selectedProductId,
        productName: product.name,
        reason: productReason,
        quantityDisputed: productQuantity ? quantity : undefined,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        description: productDescription || undefined,
      },
    ]);

    // Reset product form
    setSelectedProductId('');
    setProductReason('');
    setProductQuantity('');
    setProductDescription('');
  };

  const handleRemoveProduct = (index: number) => {
    setDisputedProducts(disputedProducts.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedBillId || !title) {
      toast.error('Please select a bill and provide a title');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: selectedBillId,
          type,
          title,
          description: description || undefined,
          amountDisputed: amountDisputed ? parseFloat(amountDisputed) : undefined,
          products: disputedProducts.length > 0 ? disputedProducts : undefined,
        }),
      });

      if (response.ok) {
        toast.success('Dispute created successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create dispute');
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error('Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Dispute</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="bill">Bill *</Label>
              <Select value={selectedBillId} onValueChange={setSelectedBillId} disabled={!!preFillBillId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bill" />
                </SelectTrigger>
                <SelectContent>
                  {bills.map((bill) => (
                    <SelectItem key={bill.id} value={bill.id}>
                      {bill.filename}
                      {bill.supplier && ` - ${bill.supplier}`}
                      {bill.billDate && ` (${new Date(bill.billDate).toLocaleDateString()})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {preFillBillId && (
                <p className="text-xs text-gray-500 mt-1">Pre-filled from current bill</p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETURN">Return</SelectItem>
                  <SelectItem value="COMPLAINT">Complaint</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the dispute"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="amount">Amount Disputed (€)</Label>
                {isManualAmount && disputedProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsManualAmount(false)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Re-enable auto-calc
                  </button>
                )}
              </div>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amountDisputed}
                onChange={(e) => {
                  setAmountDisputed(e.target.value);
                  setIsManualAmount(true);
                }}
                placeholder="0.00"
              />
              {!isManualAmount && disputedProducts.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  Auto-calculated from products below
                </p>
              )}
              {isManualAmount && (
                <p className="text-xs text-gray-500 mt-1">
                  Manual entry (auto-calculation disabled)
                </p>
              )}
            </div>
          </div>

          {/* Disputed Products */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Disputed Products (Optional)</Label>
              {preFillBillProducts && preFillBillProducts.length > 0 && (
                <span className="text-xs text-blue-600">
                  Showing {availableProducts.length} product{availableProducts.length !== 1 ? 's' : ''} from this bill
                </span>
              )}
            </div>

            {/* Existing Products */}
            {disputedProducts.length > 0 && (
              <div className="space-y-2">
                {disputedProducts.map((dp, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{dp.productName}</div>
                      <div className="text-sm text-gray-600">
                        {dp.reason}
                        {dp.quantityDisputed && ` • ${dp.quantityDisputed} units`}
                        {dp.unitPrice !== undefined && ` @ ${dp.unitPrice.toFixed(2)}€/unit`}
                      </div>
                      {dp.description && (
                        <div className="text-xs text-gray-500 mt-1">{dp.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {dp.totalPrice !== undefined && dp.totalPrice > 0 && (
                        <div className="text-sm font-semibold text-orange-600">
                          {dp.totalPrice.toFixed(2)}€
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Product Form */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason *</Label>
                <Input
                  id="reason"
                  value={productReason}
                  onChange={(e) => setProductReason(e.target.value)}
                  placeholder="e.g., Damaged, Wrong item, Quality issue"
                />
              </div>

              <div>
                <Label htmlFor="productDesc">Product-specific notes</Label>
                <Textarea
                  id="productDesc"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Additional details about this product"
                  rows={2}
                />
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleAddProduct}
                disabled={!selectedProductId || !productReason}
              >
                Add Product
              </Button>
            </div>
          </div>

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
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !selectedBillId || !title}
            >
              {loading ? 'Creating...' : 'Create Dispute'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
