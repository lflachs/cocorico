'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Building2, Mail, Phone, MapPin, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/providers/LanguageProvider';
import type { Supplier } from '@prisma/client';

type SuppliersListProps = {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
};

export function SuppliersList({ suppliers, onEdit }: SuppliersListProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, supplierId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSupplierToDelete(supplierId);
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;

    setDeletingId(supplierToDelete);
    try {
      const response = await fetch(`/api/suppliers/${supplierToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete supplier');
      }

      toast.success('Supplier deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Error deleting supplier. Please try again.');
    } finally {
      setDeletingId(null);
      setSupplierToDelete(null);
    }
  };

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 text-lg font-medium">No suppliers yet</p>
        <p className="text-gray-400 text-sm mt-2">Add your first supplier to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="relative group p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                  <Badge
                    variant="outline"
                    className={supplier.isActive ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-50 text-gray-700 border-gray-300'}
                  >
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm text-gray-600 ml-8">
                  {supplier.contactName && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Contact:</span>
                      <span>{supplier.contactName}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{supplier.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(supplier)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 hover:text-blue-600"
                  title="Edit supplier"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDeleteClick(e, supplier.id)}
                  disabled={deletingId === supplier.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                  title="Delete supplier"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {supplier.notes && (
              <div className="mt-3 text-sm text-gray-600 ml-8 p-2 bg-gray-50 rounded">
                <p className="italic">{supplier.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this supplier? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
