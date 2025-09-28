import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Download } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { stats, loading } = useDashboardStats();
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'paid':
        return "secondary";
      case 'pending':
        return "secondary";
      case 'late':
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'paid':
        return "bg-success/10 text-success hover:bg-success/20";
      case 'pending':
        return "bg-warning/10 text-warning hover:bg-warning/20";
      case 'late':
        return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground hover:bg-muted/20";
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
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <TrendingUp className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('dashboard.analytics')}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('dashboard.exportReport')}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard title={t('dashboard.totalCategories')} value={stats.totalCategories} />
          <StatsCard title={t('dashboard.totalProducts')} value={stats.totalProducts} />
          <StatsCard title={t('dashboard.totalCustomers')} value={stats.totalCustomers} />
          <StatsCard title={t('dashboard.totalOrders')} value={stats.totalOrders} />
          <StatsCard title={t('dashboard.pendingInstallments')} value={stats.pendingInstallments} />
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard 
            title={t('dashboard.totalSales')} 
            value={formatCurrency(stats.totalSales)} 
          />
          <StatsCard 
            title={t('dashboard.totalCost')} 
            value={formatCurrency(stats.totalCost)} 
          />
          <StatsCard 
            title={t('dashboard.profit')} 
            value={formatCurrency(stats.profit)} 
            className={stats.profit >= 0 ? "text-green-600" : "text-red-600"}
          />
          <StatsCard 
            title={t('dashboard.totalPaidInstallments')} 
            value={formatCurrency(stats.totalPaidInstallments)} 
          />
          <StatsCard 
            title={t('dashboard.remainingAmount')} 
            value={formatCurrency(stats.totalRemainingAmount)} 
          />
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Recent Orders Table */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-card-foreground">{t('dashboard.recentOrders')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.customer')}</th>
                    <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.amount')}</th>
                    <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.status')}</th>
                    <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border">
                      <td className="px-6 py-4 text-sm text-card-foreground">{order.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-card-foreground">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={getStatusVariant(order.status)}
                          className={getStatusClass(order.status)}
                        >
                          {t(`orders.status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {stats.recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        {t('dashboard.noRecentOrders')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Installments Table */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-card-foreground">{t('dashboard.pendingInstallmentsList')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.customer')}</th>
                    <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.amount')}</th>
                    <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('dashboard.dueDate')}</th>
                    <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pendingInstallmentsList.map((installment) => (
                    <tr key={installment.id} className="border-b border-border">
                      <td className="px-6 py-4 text-sm text-card-foreground">{installment.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-card-foreground">{formatCurrency(installment.amount)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(installment.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={getStatusVariant(installment.status)}
                          className={getStatusClass(installment.status)}
                        >
                          {t(`installments.status${installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}`)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {stats.pendingInstallmentsList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        {t('dashboard.noPendingInstallments')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}