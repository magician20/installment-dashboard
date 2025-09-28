import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DashboardStats {
  totalCategories: number;
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  pendingInstallments: number;
  totalSales: number;
  totalPaidInstallments: number;
  totalRemainingAmount: number;
  totalCost: number;
  profit: number;
  recentOrders: Array<{
    id: string;
    customer_name: string;
    total_amount: number;
    status: string;
    order_date: string;
  }>;
  pendingInstallmentsList: Array<{
    id: string;
    customer_name: string;
    amount: number;
    due_date: string;
    status: string;
    installment_number: string;
  }>;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCategories: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    pendingInstallments: 0,
    totalSales: 0,
    totalPaidInstallments: 0,
    totalRemainingAmount: 0,
    totalCost: 0,
    profit: 0,
    recentOrders: [],
    pendingInstallmentsList: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardStats = async () => {
    try {
      // Fetch financial metrics using the function
      const { data: financialData, error: financialError } = await supabase
        .rpc('get_financial_metrics');

      if (financialError) throw financialError;

      // Fetch recent orders and installments
      const [
        { data: recentOrdersData, error: recentOrdersError },
        { data: pendingInstallmentsData, error: pendingInstallmentsError }
      ] = await Promise.all([
        supabase.rpc('get_recent_orders', { limit_count: 5 }),
        supabase.rpc('get_pending_installments', { limit_count: 5 })
      ]);

      if (recentOrdersError) throw recentOrdersError;
      if (pendingInstallmentsError) throw pendingInstallmentsError;

      const metrics = financialData?.[0] as any || {};

      setStats({
        totalCategories: Number(metrics?.total_categories) || 0,
        totalProducts: Number(metrics?.total_products) || 0,
        totalCustomers: Number(metrics?.total_customers) || 0,
        totalOrders: Number(metrics?.total_orders) || 0,
        pendingInstallments: Number(metrics?.pending_installments_count) || 0,
        totalSales: Number(metrics?.total_sales) || 0,
        totalPaidInstallments: Number(metrics?.total_paid_installments) || 0,
        totalRemainingAmount: Number(metrics?.remaining_installments_amount) || 0,
        totalCost: Number(metrics?.total_cost) || 0,
        profit: Number(metrics?.profit) || 0,
        recentOrders: recentOrdersData?.map(order => ({
          id: order.id,
          customer_name: order.customer_name,
          total_amount: Number(order.total_amount),
          status: order.status,
          order_date: order.order_date,
        })) || [],
        pendingInstallmentsList: pendingInstallmentsData?.map(installment => ({
          id: installment.id,
          customer_name: installment.customer_name,
          amount: Number(installment.amount),
          due_date: installment.due_date,
          status: installment.status,
          installment_number: installment.installment_number,
        })) || [],
      });
    } catch (error: any) {
      toast({
        title: "Error fetching dashboard stats",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return {
    stats,
    loading,
    refetch: fetchDashboardStats,
  };
}