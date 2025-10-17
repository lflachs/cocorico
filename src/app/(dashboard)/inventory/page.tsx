import { getProducts } from '@/lib/queries/product.queries';
import { ProductList } from './_components/ProductList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

/**
 * Inventory Page (Server Component)
 * Displays all products in stock with shadcn/ui styling
 */

export default async function InventoryPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory</h1>
          <p className="mt-2 text-gray-600">Manage your stock and products</p>
        </div>
        <Link href="/inventory/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <ProductList products={products} />
    </div>
  );
}
