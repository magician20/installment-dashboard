import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Payment, CreatePaymentData } from '@/hooks/usePayments';
import { useOrders } from '@/hooks/useOrders';
import { useInstallments } from '@/hooks/useInstallments';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment | null;
  onSubmit: (data: CreatePaymentData) => Promise<any>;
  title: string;
  description: string;
  prePaymentData?: {
    plan: any;
    baseTotal: number;
    totalAmount: number;
  };
}

const PAYMENT_METHODS = [
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'check',
];

export function PaymentDialog({ open, onOpenChange, payment, onSubmit, title, description, prePaymentData }: PaymentDialogProps) {
  const { orders } = useOrders();
  const { installments } = useInstallments();
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const [formData, setFormData] = useState<CreatePaymentData>({
    order_id: '',
    amount: 0,
    payment_method: '',
    payment_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      setFormData({
        order_id: payment.order_id,
        installment_id: payment.installment_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        reference_number: payment.reference_number,
        notes: payment.notes,
        payment_date: payment.payment_date,
      });
    } else if (prePaymentData) {
      // Pre-payment flow: set amount based on plan type
      const amount = prePaymentData.plan.plan_type === 'flexible' 
        ? prePaymentData.plan.advance_payment_amount || 0
        : prePaymentData.totalAmount / prePaymentData.plan.duration; // First installment for fixed plans
      
      setFormData({
        order_id: '',
        installment_id: undefined,
        amount: amount,
        payment_method: '',
        reference_number: '',
        notes: '',
        payment_date: new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        order_id: '',
        amount: 0,
        payment_method: '',
        payment_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [payment, prePaymentData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('PaymentDialog handleSubmit called', { formData, prePaymentData });
    
    if (!formData.payment_method || formData.amount <= 0) {
      console.log('Validation failed: missing payment method or amount');
      return;
    }
    
    // For pre-payment flow, we don't need order_id validation
    if (!prePaymentData && !formData.order_id) {
      console.log('Validation failed: missing order_id and no prePaymentData');
      return;
    }

    console.log('Starting payment processing...');
    setLoading(true);
    
    try {
      // For pre-payment flow, pass the payment data with plan information
      const paymentData = prePaymentData 
        ? { ...formData, prePaymentData }
        : formData;
        
      console.log('Calling onSubmit with paymentData:', paymentData);
      const result = await onSubmit(paymentData);
      console.log('onSubmit result:', result);
      
      setLoading(false);

      if (!result.error) {
        console.log('Payment successful, closing dialog');
        onOpenChange(false);
      } else {
        console.error('Payment failed:', result.error);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen && !payment) {
      setFormData({
        order_id: '',
        amount: 0,
        payment_method: '',
        payment_date: new Date().toISOString().split('T')[0],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px]" dir={direction}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {!prePaymentData && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="order" className="ltr:text-right rtl:text-left">
                  {t('payments.customer')}
                </Label>
                <Select
                  value={formData.order_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, order_id: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('orders.customer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.customer?.first_name} {order.customer?.last_name} - {order.total_amount.toLocaleString()} EGP ({new Date(order.order_date).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {prePaymentData && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="ltr:text-right rtl:text-left">
                  {t('installmentPlans.name')}
                </Label>
                <div className="col-span-3 p-3 bg-muted rounded-md">
                  <div className="text-sm">
                    <strong>{prePaymentData.plan.name}</strong> ({prePaymentData.plan.plan_type === 'flexible' ? t('payments.flexible') : t('payments.fixed')})
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {prePaymentData.plan.plan_type === 'flexible' 
                      ? `${t('payments.advancePayment')}: ${prePaymentData.plan.advance_payment_amount?.toLocaleString()} EGP`
                      : `${t('payments.firstInstallment')}: ${(prePaymentData.totalAmount / prePaymentData.plan.duration).toLocaleString()} EGP`
                    }
                  </div>
                </div>
              </div>
            )}
            
            {!prePaymentData && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="installment" className="ltr:text-right rtl:text-left">
                  {t('payments.installmentNumber')}
                </Label>
                <Select
                  value={formData.installment_id || 'none'}
                  onValueChange={(value) => {
                    const selectedInstallment = installments.find(inst => inst.id === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      installment_id: value === 'none' ? undefined : value,
                      amount: selectedInstallment ? selectedInstallment.amount : prev.amount
                    }));
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('payments.selectInstallmentOptional')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('payments.noSpecificInstallment')}</SelectItem>
                    {installments
                      .filter(inst => inst.order_id === formData.order_id && inst.status !== 'paid')
                      .map((installment) => (
                      <SelectItem key={installment.id} value={installment.id}>
                        {t('payments.installmentNumber')}{installment.installment_number} - {installment.amount.toLocaleString()} EGP ({t('payments.due')}: {new Date(installment.due_date).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="ltr:text-right rtl:text-left">
                {t('payments.amount')}
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="col-span-3"
                placeholder="0.00"
                required
                readOnly={!!prePaymentData || !!formData.installment_id}
                style={(prePaymentData || formData.installment_id) ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment_method" className="ltr:text-right rtl:text-left">
                {t('payments.paymentMethod')}
              </Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('payments.paymentMethod')} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {t(`payments.paymentMethod_${method}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment_date" className="ltr:text-right rtl:text-left">
                {t('payments.paymentDate')}
              </Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receipt_number" className="ltr:text-right rtl:text-left">
                {t('payments.receipt')}
              </Label>
              <Input
                id="receipt_number"
                value={formData.reference_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                className="col-span-3"
                placeholder={t('payments.optionalReceiptNumber')}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="ltr:text-right rtl:text-left">
                {t('common.description')}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="col-span-3"
                placeholder={t('payments.optionalPaymentNotes')}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (!prePaymentData && !formData.order_id) || !formData.payment_method || formData.amount <= 0}
              onClick={(e) => {
                console.log('Record button clicked', { 
                  loading, 
                  prePaymentData: !!prePaymentData, 
                  order_id: formData.order_id, 
                  payment_method: formData.payment_method, 
                  amount: formData.amount 
                });
              }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {payment ? t('common.edit') : t('payments.addNew')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}