import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Installment, CreateInstallmentData } from '@/hooks/useInstallments';
import { useOrders } from '@/hooks/useOrders';
import { useInstallmentPlans } from '@/hooks/useInstallmentPlans';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

interface InstallmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installment?: Installment | null;
  onSubmit: (data: CreateInstallmentData) => Promise<any>;
  title: string;
  description: string;
}

const INSTALLMENT_STATUSES = [
  'pending',
  'paid',
  'late',
];

export function InstallmentDialog({ open, onOpenChange, installment, onSubmit, title, description }: InstallmentDialogProps) {
  const { orders } = useOrders();
  const { installmentPlans } = useInstallmentPlans();
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const [formData, setFormData] = useState<CreateInstallmentData>({
    order_id: '',
    installment_plan_id: '',
    installment_number: '1',
    due_date: '',
    amount: 0,
    status: 'pending',
    late_fee: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (installment) {
      setFormData({
        order_id: installment.order_id,
        installment_plan_id: installment.installment_plan_id,
        installment_number: installment.installment_number,
        due_date: installment.due_date,
        amount: installment.amount,
        status: installment.status,
        late_fee: installment.late_fee,
      });
    } else {
      setFormData({
        order_id: '',
        installment_plan_id: '',
        installment_number: '1',
        due_date: '',
        amount: 0,
        status: 'pending',
        late_fee: 0,
      });
    }
  }, [installment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.order_id || !formData.installment_plan_id || formData.amount <= 0) return;

    setLoading(true);
    const result = await onSubmit(formData);
    setLoading(false);

    if (!result.error) {
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen && !installment) {
      setFormData({
        order_id: '',
        installment_plan_id: '',
        installment_number: '1',
        due_date: '',
        amount: 0,
        status: 'pending',
        late_fee: 0,
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order" className="ltr:text-right rtl:text-left">
                {t('installments.order')}
              </Label>
              <Select
                value={formData.order_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, order_id: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('installments.selectOrder')} />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.customer?.first_name} {order.customer?.last_name} - {order.total_amount.toLocaleString()} EGP
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan" className="ltr:text-right rtl:text-left">
                {t('installments.plan')}
              </Label>
              <Select
                value={formData.installment_plan_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, installment_plan_id: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('installments.selectPlan')} />
                </SelectTrigger>
                <SelectContent>
                  {installmentPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.duration} months @ {plan.interest_rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="installment_number" className="ltr:text-right rtl:text-left">
                {t('installments.installmentNumber')}
              </Label>
              <Input
                id="installment_number"
                type="number"
                min="1"
                value={formData.installment_number}
                onChange={(e) => setFormData(prev => ({ ...prev, installment_number: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="ltr:text-right rtl:text-left">
                {t('installments.amount')}
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
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due_date" className="ltr:text-right rtl:text-left">
                {t('installments.dueDate')}
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="ltr:text-right rtl:text-left">
                {t('installments.status')}
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('installments.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  {INSTALLMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`installments.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="late_fee" className="ltr:text-right rtl:text-left">
                {t('installments.lateFee')}
              </Label>
              <Input
                id="late_fee"
                type="number"
                step="0.01"
                min="0"
                value={formData.late_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, late_fee: parseFloat(e.target.value) || 0 }))}
                className="col-span-3"
                placeholder="0.00"
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
              disabled={loading || !formData.order_id || !formData.installment_plan_id || formData.amount <= 0}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {installment ? t('installments.update') : t('installments.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}