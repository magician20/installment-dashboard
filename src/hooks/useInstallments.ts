import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Installment {
  id: string;
  order_id: string;
  installment_plan_id: string;
  installment_number: string;
  due_date: string;
  amount: number;
  status: string;
  payment_date?: string;
  late_fee: number;
  created_at: string;
  updated_at: string;
  orders?: {
    customer_id: string;
    customers: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  installment_plans?: {
    name: string;
  };
}

export interface CreateInstallmentData {
  order_id: string;
  installment_plan_id: string;
  installment_number: string;
  due_date: string;
  amount: number;
  status?: string;
  late_fee?: number;
}

export function useInstallments() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInstallments = async () => {
    try {
      const { data, error } = await supabase
        .from('installments')
        .select(`
          *,
          orders!inner(
            customer_id,
            customers!inner(first_name, last_name, email)
          ),
          installment_plans!inner(name)
        `)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setInstallments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching installments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInstallment = async (installmentData: CreateInstallmentData) => {
    try {
      const { data, error } = await supabase
        .from('installments')
        .insert([installmentData])
        .select(`
          *,
          orders!inner(
            customer_id,
            customers!inner(first_name, last_name, email)
          ),
          installment_plans!inner(name)
        `)
        .single();

      if (error) throw error;
      
      setInstallments(prev => [data, ...prev]);
      toast({
        title: "Installment created",
        description: "Installment has been created successfully.",
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating installment",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateInstallment = async (id: string, installmentData: Partial<CreateInstallmentData>) => {
    try {
      const { data, error } = await supabase
        .from('installments')
        .update(installmentData)
        .eq('id', id)
        .select(`
          *,
          orders!inner(
            customer_id,
            customers!inner(first_name, last_name, email)
          ),
          installment_plans!inner(name)
        `)
        .single();

      if (error) throw error;

      setInstallments(prev => prev.map(installment => installment.id === id ? data : installment));
      toast({
        title: "Installment updated",
        description: "Installment has been updated successfully.",
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating installment",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteInstallment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('installments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInstallments(prev => prev.filter(installment => installment.id !== id));
      toast({
        title: "Installment deleted",
        description: "Installment has been deleted successfully.",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error deleting installment",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, []);

  return {
    installments,
    loading,
    createInstallment,
    updateInstallment,
    deleteInstallment,
    refetch: fetchInstallments,
  };
}