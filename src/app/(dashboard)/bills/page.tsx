import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import Link from 'next/link';
import { getTranslation } from '@/lib/i18n';
import { cookies } from 'next/headers';
import { getAllBills } from '@/lib/services/bill.service';
import { BillsList } from './_components/BillsList';

/**
 * Bills Page - List and manage delivery bills/invoices
 */

export default async function BillsPage() {
  const cookieStore = await cookies();
  const language = (cookieStore.get('language')?.value as 'en' | 'fr') || 'en';
  const t = getTranslation(language);

  // Fetch bills from database
  const bills = await getAllBills();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {t('bills.title')}
          </h1>
          <p className="mt-2 text-gray-600">{t('bills.description')}</p>
        </div>
        <Link href="/bills/upload">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            {t('bills.uploadNew')}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('bills.recentBills')}
          </CardTitle>
          <CardDescription>{t('bills.recentBills.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">{t('bills.empty')}</p>
              <p className="text-sm mt-2">{t('bills.empty.hint')}</p>
              <Link href="/bills/upload">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Upload className="w-4 h-4 mr-2" />
                  {t('bills.uploadFirst')}
                </Button>
              </Link>
            </div>
          ) : (
            <BillsList bills={bills} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
