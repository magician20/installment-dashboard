import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { PaymentDialog } from '@/components/forms/PaymentDialog';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

export default function Payments() {
  const { payments, loading, createPayment } = usePayments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { t } = useTranslation();
  const { direction } = useLanguage();

  const handleCreate = () => {
    setDialogOpen(true);
  };

  const handleSubmit = async (data) => {
    return await createPayment(data);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8" dir={direction}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('payments.title')}</h1>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t('payments.addNew')}
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-card-foreground">{t('payments.header')}</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('payments.customer')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('payments.amount')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('payments.paymentDate')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('payments.paymentMethod')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('payments.receipt')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('payments.installmentNumber')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border">
                    <td className="px-6 py-4 text-sm text-card-foreground">
                      {payment.orders?.customers ? 
                        `${payment.orders.customers.first_name} ${payment.orders.customers.last_name}` 
                        : t('payments.na')}
                    </td>
                    <td className="px-6 py-4 text-sm text-card-foreground font-medium">{payment.amount.toLocaleString()} EGP</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-card-foreground">
                      {t(`payments.paymentMethod_${payment.payment_method}`)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {payment.reference_number || t('payments.na')}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {payment.installments ? `#${payment.installments.installment_number}` : t('payments.na')}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      {t('payments.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <PaymentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          payment={null}
          onSubmit={handleSubmit}
          title={t('payments.dialogTitle')}
          description={t('payments.dialogDescription')}
        />
      </div>
    </DashboardLayout>
  );
}