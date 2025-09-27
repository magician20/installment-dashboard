import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useInstallmentPlans } from '@/hooks/useInstallmentPlans';
import { InstallmentPlanDialog } from '@/components/forms/InstallmentPlanDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

export default function InstallmentPlans() {
  const { installmentPlans, loading, createInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan } = useInstallmentPlans();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const { t } = useTranslation();
  const { direction } = useLanguage();

  const handleCreate = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleDelete = (plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (planToDelete) {
      await deleteInstallmentPlan(planToDelete.id);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleSubmit = async (data) => {
    if (editingPlan) {
      return await updateInstallmentPlan(editingPlan.id, data);
    } else {
      return await createInstallmentPlan(data);
    }
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
          <h1 className="text-3xl font-bold text-foreground">{t('installmentPlans.title')}</h1>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t('installmentPlans.addNew')}
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-card-foreground">{t('installmentPlans.header')}</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installmentPlans.name')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installmentPlans.planType')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installmentPlans.duration')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installmentPlans.interestRate')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installmentPlans.gracePeriod')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installmentPlans.created')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {installmentPlans.map((plan) => (
                  <tr key={plan.id} className="border-b border-border">
                    <td className="px-6 py-4 text-sm text-card-foreground font-medium">{plan.name}</td>
                    <td className="px-6 py-4 text-sm text-card-foreground">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.plan_type === 'fixed' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {plan.plan_type === 'fixed' ? t('installmentPlans.fixed') : t('installmentPlans.flexible')}
                      </span>
                      {plan.plan_type === 'flexible' && plan.advance_payment_amount && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {plan.advance_payment_amount.toLocaleString()} EGP {t('installmentPlans.advancePayment')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-card-foreground">{t('installmentPlans.durationValue', { count: plan.duration })}</td>
                    <td className="px-6 py-4 text-sm text-card-foreground">{plan.interest_rate}%</td>
                    <td className="px-6 py-4 text-sm text-card-foreground">{t('installmentPlans.gracePeriodValue', { count: plan.grace_period })}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="h-8 px-3"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="w-4 h-4" />
                          {t('common.edit')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-8 px-3"
                          onClick={() => handleDelete(plan)}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {installmentPlans.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      {t('installmentPlans.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <InstallmentPlanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          plan={editingPlan}
          onSubmit={handleSubmit}
          title={editingPlan ? t('installmentPlans.editTitle') : t('installmentPlans.createTitle')}
          description={editingPlan ? t('installmentPlans.editDescription') : t('installmentPlans.createDescription')}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('installmentPlans.deleteConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('installmentPlans.deleteConfirmDescription', { name: planToDelete?.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}