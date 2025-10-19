'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileText, Calendar, Package, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/providers/LanguageProvider';
import { DisputeModal } from '../../disputes/_components/DisputeModal';

/**
 * Bills List Component
 * Display list of bills with delete functionality
 */

type Bill = {
  id: string;
  filename: string;
  supplier: { name: string } | null;
  billDate: Date | null;
  totalAmount: number | null;
  createdAt: Date;
  products: any[];
  status: 'PENDING' | 'PROCESSED' | 'DISPUTED';
};

type BillsListProps = {
  bills: Bill[];
};

export function BillsList({ bills }: BillsListProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedBillForDispute, setSelectedBillForDispute] = useState<string | null>(null);
  const [billProducts, setBillProducts] = useState<any[]>([]);

  const getStatusBadge = (status: Bill['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            {t('bills.status.pending')}
          </Badge>
        );
      case 'PROCESSED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            {t('bills.status.processed')}
          </Badge>
        );
      case 'DISPUTED':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
            {t('bills.status.disputed')}
          </Badge>
        );
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, billId: string) => {
    e.preventDefault(); // Prevent navigation to bill detail
    e.stopPropagation();
    setBillToDelete(billId);
  };

  const handleDisputeClick = async (e: React.MouseEvent, billId: string) => {
    e.preventDefault(); // Prevent navigation to bill detail
    e.stopPropagation();

    // Fetch bill products for pre-filling
    try {
      const response = await fetch(`/api/bills/${billId}`);
      if (response.ok) {
        const billData = await response.json();
        const bill = bills.find(b => b.id === billId);
        if (bill && bill.products) {
          setBillProducts(bill.products);
        }
      }
    } catch (error) {
      console.error('Error fetching bill products:', error);
    }

    setSelectedBillForDispute(billId);
    setDisputeModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!billToDelete) return;

    setDeletingId(billToDelete);
    try {
      const response = await fetch(`/api/bills/${billToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bill');
      }

      toast.success(t('bills.delete.success'));
      router.refresh(); // Refresh the page to update the list
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error(t('bills.delete.error'));
    } finally {
      setDeletingId(null);
      setBillToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {bills.map((bill) => (
          <div key={bill.id} className="relative group">
            <Link href={`/bills/${bill.id}/confirm`}>
              <div className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-12">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{bill.filename}</h3>
                      {getStatusBadge(bill.status)}
                      <Badge variant="outline" className="text-xs">
                        {bill.products.length} {bill.products.length === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 ml-8">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span>{bill.supplier?.name || 'Unknown supplier'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {bill.billDate
                            ? format(new Date(bill.billDate), 'MMM dd, yyyy')
                            : 'No date'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Total: </span>
                        <span className="font-semibold text-gray-900">
                          {bill.totalAmount?.toFixed(2) || '0.00'} €
                        </span>
                      </div>
                      <div className="text-gray-500">
                        Uploaded {format(new Date(bill.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Action Buttons - positioned absolutely */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDisputeClick(e, bill.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-100 hover:text-orange-600"
                title="Start dispute"
              >
                <AlertTriangle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDeleteClick(e, bill.id)}
                disabled={deletingId === bill.id}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                title="Delete bill"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!billToDelete} onOpenChange={(open) => !open && setBillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bills.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('bills.delete.confirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>{t('bills.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId ? t('bills.delete.deleting') : t('bills.delete.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dispute Modal */}
      <DisputeModal
        open={disputeModalOpen}
        onOpenChange={(open) => {
          setDisputeModalOpen(open);
          if (!open) {
            setSelectedBillForDispute(null);
            setBillProducts([]);
          }
        }}
        onSuccess={() => {
          toast.success('Dispute created successfully');
          setDisputeModalOpen(false);
          setSelectedBillForDispute(null);
          setBillProducts([]);
          router.refresh();
        }}
        preFillBillId={selectedBillForDispute || undefined}
        preFillBillProducts={billProducts.length > 0 ? billProducts : undefined}
      />
    </>
  );
}
