import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { InstallmentPlan, CreateInstallmentPlanData, PlanType } from '@/hooks/useInstallmentPlans';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

interface InstallmentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: InstallmentPlan | null;
  onSubmit: (data: CreateInstallmentPlanData) => Promise<any>;
  title: string;
  description: string;
}

export function InstallmentPlanDialog({ open, onOpenChange, plan, onSubmit, title, description }: InstallmentPlanDialogProps) {
  const { t } = useTranslation();
  const { direction } = useLanguage();
  
  const [formData, setFormData] = useState<CreateInstallmentPlanData>({
    name: '',
    plan_type: 'fixed',
    duration: 0,
    interest_rate: 0,
    grace_period: 0,
    advance_payment_amount: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        plan_type: plan.plan_type,
        duration: plan.duration,
        interest_rate: plan.interest_rate,
        grace_period: plan.grace_period,
        advance_payment_amount: plan.advance_payment_amount || 0,
      });
    } else {
      setFormData({
        name: '',
        plan_type: 'fixed',
        duration: 0,
        interest_rate: 0,
        grace_period: 0,
        advance_payment_amount: 0,
      });
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.duration <= 0) return;

    setLoading(true);
    const result = await onSubmit(formData);
    setLoading(false);

    if (!result.error) {
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen && !plan) {
      setFormData({
        name: '',
        plan_type: 'fixed',
        duration: 0,
        interest_rate: 0,
        grace_period: 0,
        advance_payment_amount: 0,
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
              <Label htmlFor="name" className="text-right">
                {t('installmentPlans.name')}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder={t('installmentPlans.namePlaceholder')}
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan_type" className="text-right">
                {t('installmentPlans.planType')}
              </Label>
              <Select 
                value={formData.plan_type} 
                onValueChange={(value: PlanType) => 
                  setFormData(prev => ({ ...prev, plan_type: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t('installmentPlans.fixed')}</SelectItem>
                  <SelectItem value="flexible">{t('installmentPlans.flexible')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                {formData.plan_type === 'fixed' 
                  ? t('installmentPlans.duration') 
                  : t('installmentPlans.remainingDuration')
                }
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max={formData.plan_type === 'fixed' ? 12 : 36}
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                className="col-span-3"
                placeholder={formData.plan_type === 'fixed' 
                  ? t('installmentPlans.durationPlaceholder')
                  : t('installmentPlans.remainingDurationPlaceholder')
                }
                required
              />
            </div>
            
            {formData.plan_type === 'flexible' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="advance_payment" className="text-right">
                  {t('installmentPlans.advancePayment')}
                </Label>
                <Input
                  id="advance_payment"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.advance_payment_amount || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    advance_payment_amount: parseFloat(e.target.value) || 0 
                  }))}
                  className="col-span-3"
                  placeholder={t('installmentPlans.advancePaymentPlaceholder')}
                />
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interest_rate" className="text-right">
                {t('installmentPlans.interestRate')}
              </Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.interest_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))}
                className="col-span-3"
                placeholder={t('installmentPlans.interestRatePlaceholder')}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="grace_period" className="text-right">
                {t('installmentPlans.gracePeriod')}
              </Label>
              <Input
                id="grace_period"
                type="number"
                min="0"
                value={formData.grace_period}
                onChange={(e) => setFormData(prev => ({ ...prev, grace_period: parseInt(e.target.value) || 0 }))}
                className="col-span-3"
                placeholder={t('installmentPlans.gracePeriodPlaceholder')}
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
              disabled={loading || !formData.name.trim() || formData.duration <= 0}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}