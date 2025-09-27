import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PlanType = 'fixed' | 'flexible';

export interface InstallmentPlan {
  id: string;
  name: string;
  plan_type: PlanType;
  duration: number;
  interest_rate: number;
  grace_period: number;
  advance_payment_amount?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInstallmentPlanData {
  name: string;
  plan_type: PlanType;
  duration: number;
  interest_rate: number;
  grace_period: number;
  advance_payment_amount?: number | null;
}

export function useInstallmentPlans() {
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInstallmentPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('installment_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Handle existing plans that might not have the new fields
      const plansWithDefaults = (data || []).map((plan: any) => ({
        ...plan,
        plan_type: plan.plan_type || 'fixed',
        advance_payment_amount: plan.advance_payment_amount || null,
      }));
      
      setInstallmentPlans(plansWithDefaults);
    } catch (error: any) {
      toast({
        title: "Error fetching installment plans",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInstallmentPlan = async (planData: CreateInstallmentPlanData) => {
    try {
      // Prepare data for database - remove undefined advance_payment_percentage if not needed
      const dbData = {
        name: planData.name,
        duration: planData.duration,
        interest_rate: planData.interest_rate,
        grace_period: planData.grace_period,
        plan_type: planData.plan_type,
        ...(planData.advance_payment_amount != null && planData.advance_payment_amount > 0 && {
          advance_payment_amount: planData.advance_payment_amount
        })
      };

      const { data, error } = await supabase
        .from('installment_plans')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;
      
      const planWithDefaults = {
        ...data,
        plan_type: (data as any).plan_type || 'fixed',
        advance_payment_amount: (data as any).advance_payment_amount || null,
      };
      
      setInstallmentPlans(prev => [planWithDefaults, ...prev]);
      toast({
        title: "Installment plan created",
        description: `Plan "${planData.name}" has been created successfully.`,
      });
      return { data: planWithDefaults, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating installment plan",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateInstallmentPlan = async (id: string, planData: Partial<CreateInstallmentPlanData>) => {
    try {
      // Prepare data for database - handle optional fields
      const dbData: any = {
        name: planData.name,
        duration: planData.duration,
        interest_rate: planData.interest_rate,
        grace_period: planData.grace_period,
        plan_type: planData.plan_type,
      };
      
      if (planData.advance_payment_amount != null) {
        if (planData.advance_payment_amount > 0) {
          dbData.advance_payment_amount = planData.advance_payment_amount;
        } else {
          dbData.advance_payment_amount = null;
        }
      }

      const { data, error } = await supabase
        .from('installment_plans')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const planWithDefaults = {
        ...data,
        plan_type: (data as any).plan_type || 'fixed',
        advance_payment_amount: (data as any).advance_payment_amount || null,
      };

      setInstallmentPlans(prev => prev.map(plan => plan.id === id ? planWithDefaults : plan));
      toast({
        title: "Installment plan updated",
        description: "Plan has been updated successfully.",
      });
      return { data: planWithDefaults, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating installment plan",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteInstallmentPlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('installment_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInstallmentPlans(prev => prev.filter(plan => plan.id !== id));
      toast({
        title: "Installment plan deleted",
        description: "Plan has been deleted successfully.",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error deleting installment plan",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchInstallmentPlans();
  }, []);

  return {
    installmentPlans,
    loading,
    createInstallmentPlan,
    updateInstallmentPlan,
    deleteInstallmentPlan,
    refetch: fetchInstallmentPlans,
  };
}