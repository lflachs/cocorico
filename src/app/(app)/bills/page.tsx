import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BillsPageContent } from './_components/BillsPageContent';
import { getAllBills } from '@/lib/services/bill.service';
import { db } from '@/lib/db/client';
import { getTranslation } from '@/lib/i18n';
import { cookies } from 'next/headers';

/**
 * Bills Page (Server Component)
 * List and manage delivery bills/invoices and suppliers
 */

export const dynamic = 'force-dynamic';

export default async function BillsPage() {
  const cookieStore = await cookies();
  const language = (cookieStore.get('language')?.value as 'en' | 'fr') || 'en';
  const t = getTranslation(language);

  // Fetch data server-side
  const [rawBills, suppliers] = await Promise.all([
    getAllBills(),
    db.supplier.findMany({ orderBy: { name: 'asc' } }),
  ]);

  // Transform bills data to only include necessary supplier data for client
  const bills = rawBills.map((bill) => ({
    ...bill,
    supplier: bill.supplier ? { name: bill.supplier.name } : null,
  }));

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <PageHeader
        title={t('bills.title')}
        subtitle={t('bills.description')}
        icon={FileText}
      />

      <BillsPageContent initialBills={bills} initialSuppliers={suppliers} />
    </div>
  );
}
