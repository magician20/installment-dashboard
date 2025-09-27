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
    installment_number: number;
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
    recentOrders: [],
    pendingInstallmentsList: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        categoriesResult,
        productsResult,
        customersResult,
        ordersResult,
        installmentsResult,
        paidInstallmentsResult,
        allInstallmentsResult,
        paymentsResult,
        recentOrdersResult,
        pendingInstallmentsResult,
      ] = await Promise.all([
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount'),
        supabase.from('installments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('installments').select('amount').eq('status', 'paid'),
        supabase.from('installments').select('amount'),
        supabase.from('payments').select('amount'),
        supabase
          .from('orders')
          .select(`
            id,
            total_amount,
            status,
            order_date,
            customers!inner(first_name, last_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('installments')
          .select(`
            id,
            amount,
            due_date,
            status,
            installment_number,
            orders!inner(
              customers!inner(first_name, last_name)
            )
          `)
          .eq('status', 'pending')
          .order('due_date', { ascending: true })
          .limit(5),
      ]);

      // Calculate total sales
      const totalSales = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Calculate total paid installments amount
      const totalPaidInstallments = paidInstallmentsResult.data?.reduce((sum, installment) => sum + Number(installment.amount), 0) || 0;

      // Calculate total remaining amount (total installments - total payments)
      const totalInstallmentsAmount = allInstallmentsResult.data?.reduce((sum, installment) => sum + Number(installment.amount), 0) || 0;
      const totalPaymentsAmount = paymentsResult.data?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const totalRemainingAmount = totalInstallmentsAmount - totalPaymentsAmount;

      // Transform recent orders
      const recentOrders = recentOrdersResult.data?.map(order => ({
        id: order.id,
        customer_name: `${order.customers.first_name} ${order.customers.last_name}`,
        total_amount: Number(order.total_amount),
        status: order.status,
        order_date: order.order_date,
      })) || [];

      // Transform pending installments
      const pendingInstallmentsList = pendingInstallmentsResult.data?.map(installment => ({
        id: installment.id,
        customer_name: `${installment.orders.customers.first_name} ${installment.orders.customers.last_name}`,
        amount: Number(installment.amount),
        due_date: installment.due_date,
        status: installment.status,
        installment_number: installment.installment_number,
      })) || [];

      setStats({
        totalCategories: categoriesResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalCustomers: customersResult.count || 0,
        totalOrders: ordersResult.data?.length || 0,
        pendingInstallments: installmentsResult.count || 0,
        totalSales,
        totalPaidInstallments,
        totalRemainingAmount: Math.max(0, totalRemainingAmount),
        recentOrders,
        pendingInstallmentsList,
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