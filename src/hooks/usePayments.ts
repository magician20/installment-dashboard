import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  order_id: string;
  installment_id?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  orders?: {
    customer_id: string;
    customers?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  } | null;
  installments?: {
    installment_number: number;
    due_date: string;
  } | null;
}

export interface CreatePaymentData {
  order_id: string;
  installment_id?: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  payment_date?: string;
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          orders(
            customer_id,
            customers(first_name, last_name, email)
          ),
          installments(installment_number, due_date)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching payments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (paymentData: CreatePaymentData) => {
    try {
      // If installment_id is provided, use the process_payment function for better handling
      if (paymentData.installment_id) {
        const { data: functionData, error: functionError } = await supabase.rpc('process_payment', {
          p_order_id: paymentData.order_id,
          p_amount: paymentData.amount,
          p_payment_method: paymentData.payment_method,
          p_installment_id: paymentData.installment_id,
          p_reference_number: paymentData.reference_number,
          p_notes: paymentData.notes
        });

        if (functionError) throw functionError;

        // Cast the function response to the expected structure
        const result = functionData as { success: boolean; payment_id: string; remaining_amount: number };

        // Fetch the created payment with relations
        const { data: newPayment, error: fetchError } = await supabase
          .from('payments')
          .select(`
            *,
            orders(
              customer_id,
              customers(first_name, last_name, email)
            ),
            installments(installment_number, due_date)
          `)
          .eq('id', result.payment_id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (newPayment) {
          setPayments(prev => [newPayment, ...prev]);
          toast({
            title: "Payment processed",
            description: `Payment recorded successfully. ${result.remaining_amount > 0 ? `Remaining: $${result.remaining_amount}` : 'Installment fully paid!'}`,
          });
        }

        return { data: newPayment, error: null };
      } else {
        // Regular payment without installment processing
        const { data, error } = await supabase
          .from('payments')
          .insert([paymentData])
          .select(`
            *,
            orders(
              customer_id,
              customers(first_name, last_name, email)
            ),
            installments(installment_number, due_date)
          `)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setPayments(prev => [data, ...prev]);
          toast({
            title: "Payment created",
            description: "Payment has been recorded successfully.",
          });
        }
        return { data, error: null };
      }
    } catch (error: any) {
      toast({
        title: "Error creating payment",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updatePayment = async (id: string, paymentData: Partial<CreatePaymentData>) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', id)
        .select(`
          *,
          orders(
            customer_id,
            customers(first_name, last_name, email)
          ),
          installments(installment_number, due_date)
        `)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPayments(prev => prev.map(payment => payment.id === id ? data : payment));
        toast({
          title: "Payment updated",
          description: "Payment has been updated successfully.",
        });
      }
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating payment",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deletePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPayments(prev => prev.filter(payment => payment.id !== id));
      toast({
        title: "Payment deleted",
        description: "Payment has been deleted successfully.",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error deleting payment",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return {
    payments,
    loading,
    createPayment,
    updatePayment,
    deletePayment,
    refetch: fetchPayments,
  };
}