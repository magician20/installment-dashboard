import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react';
import { useInstallments } from '@/hooks/useInstallments';
import { useInstallmentPlans } from '@/hooks/useInstallmentPlans';
import { InstallmentPlanDialog } from '@/components/forms/InstallmentPlanDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

export default function Installments() {
  const { installments, loading, updateInstallment } = useInstallments();
  const { installmentPlans, loading: plansLoading, createInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan } = useInstallmentPlans();
  
  // Installments state - no editing needed
  
  // Installment Plans state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deletePlanDialogOpen, setDeletePlanDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { t } = useTranslation();
  const { direction } = useLanguage();

  // Plan handlers
  const handleCreatePlan = () => {
    setEditingPlan(null);
    setPlanDialogOpen(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanDialogOpen(true);
  };

  const handleDeletePlan = (plan) => {
    setPlanToDelete(plan);
    setDeletePlanDialogOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (planToDelete) {
      await deleteInstallmentPlan(planToDelete.id);
      setDeletePlanDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handlePlanSubmit = async (data) => {
    if (editingPlan) {
      return await updateInstallmentPlan(editingPlan.id, data);
    } else {
      return await createInstallmentPlan(data);
    }
  };

  // Filter installments based on search criteria
  const filteredInstallments = useMemo(() => {
    return installments.filter((installment) => {
      const customerName = installment.orders?.customers 
        ? `${installment.orders.customers.first_name} ${installment.orders.customers.last_name}`.toLowerCase()
        : '';
      
      const matchesSearch = searchTerm === '' || customerName.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === '' || statusFilter === 'all' || installment.status === statusFilter;
      const matchesDate = dateFilter === '' || installment.due_date.startsWith(dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [installments, searchTerm, statusFilter, dateFilter]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid": return "bg-success/10 text-success hover:bg-success/20";
      case "pending": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "late": return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      default: return "bg-muted/10 text-muted-foreground hover:bg-muted/20";
    }
  };

  if (loading || plansLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">{t('installments.title')}</h1>
        </div>

        <Tabs defaultValue="installments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="installments">{t('installments.tabInstallments')}</TabsTrigger>
            <TabsTrigger value="plans">{t('installments.tabPlans')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="installments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-foreground">{t('installments.installmentsHeader')}</h2>
              <p className="text-sm text-muted-foreground">{t('installments.installmentsSubheader')}</p>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="text-lg font-medium text-card-foreground">{t('installments.searchFilter')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t('installments.searchByCustomer')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('installments.filterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('installments.statusAll')}</SelectItem>
                      <SelectItem value="pending">{t('installments.statusPending')}</SelectItem>
                      <SelectItem value="paid">{t('installments.statusPaid')}</SelectItem>
                      <SelectItem value="late">{t('installments.statusLate')}</SelectItem>
                      <SelectItem value="overdue">{t('installments.statusOverdue')}</SelectItem>
                    </SelectContent>
                  </Select>
                <Input
                  type="date"
                  placeholder={t('installments.filterByDueDate')}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('');
                  }}
                >
                  {t('installments.clearFilters')}
                </Button>
              </div>
            </div>

            {/* Installments Table */}
            <div className="bg-card rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.customer')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.plan')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.installmentNumber')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.amount')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.dueDate')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.status')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.lateFee')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInstallments.map((installment) => (
                      <tr key={installment.id} className="border-b border-border">
                        <td className="px-6 py-4 text-sm text-card-foreground">
                          {installment.orders?.customers ? 
                            `${installment.orders.customers.first_name} ${installment.orders.customers.last_name}` 
                            : t('installments.na')}
                        </td>
                        <td className="px-6 py-4 text-sm text-card-foreground">
                          {installment.installment_plans?.name || t('installments.na')}
                        </td>
                        <td className="px-6 py-4 text-sm text-card-foreground">#{installment.installment_number}</td>
                        <td className="px-6 py-4 text-sm text-card-foreground">{installment.amount.toLocaleString()} EGP</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(installment.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant="secondary"
                            className={getStatusVariant(installment.status)}
                          >
                            {t(`installments.status${installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}`)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-card-foreground">
                          {installment.late_fee || 0 ? (installment.late_fee?.toLocaleString() + " EGP") : "0 EGP"}
                        </td>
                      </tr>
                    ))}
                    {filteredInstallments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                          {searchTerm || statusFilter || dateFilter 
                            ? t('installments.noResults')
                            : t('installments.empty')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-foreground">{t('installments.plansHeader')}</h2>
              <Button onClick={handleCreatePlan} className="bg-primary hover:bg-primary-hover">
                <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('installments.addNewPlan')}
              </Button>
            </div>

            {/* Plans Table */}
            <div className="bg-card rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.planName')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installmentPlans.planType')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.planDuration')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.planInterestRate')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.planGracePeriod')}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('installments.planCreated')}</th>
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
                        </td>
                        <td className="px-6 py-4 text-sm text-card-foreground">{t('installments.durationValue', { count: plan.duration })}</td>
                        <td className="px-6 py-4 text-sm text-card-foreground">{plan.interest_rate}%</td>
                        <td className="px-6 py-4 text-sm text-card-foreground">{t('installments.gracePeriodValue', { count: plan.grace_period })}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              className="h-8 px-3"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Edit className="w-4 h-4" />
                              {t('common.edit')}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="h-8 px-3"
                              onClick={() => handleDeletePlan(plan)}
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
                          {t('installments.noPlans')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <InstallmentPlanDialog
          open={planDialogOpen}
          onOpenChange={setPlanDialogOpen}
          plan={editingPlan}
          onSubmit={handlePlanSubmit}
          title={editingPlan ? t('installments.editPlanTitle') : t('installments.createPlanTitle')}
          description={editingPlan ? t('installments.editPlanDescription') : t('installments.createPlanDescription')}
        />

        <AlertDialog open={deletePlanDialogOpen} onOpenChange={setDeletePlanDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('installments.deletePlanConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('installments.deletePlanConfirmDescription', { name: planToDelete?.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePlan} className="bg-destructive hover:bg-destructive/90">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}