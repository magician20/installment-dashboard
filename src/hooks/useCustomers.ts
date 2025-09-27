import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  address: string | null;
  identity_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  identity_number?: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [customersWithOrders, setCustomersWithOrders] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);

      // Check which customers have orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('customer_id');

      if (ordersData) {
        const customerIds = new Set(ordersData.map(order => order.customer_id));
        setCustomersWithOrders(customerIds);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching customers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: CreateCustomerData) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;
      
      setCustomers(prev => [data, ...prev]);
      toast({
        title: "Customer created",
        description: `Customer "${customerData.first_name} ${customerData.last_name}" has been created successfully.`,
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating customer",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<CreateCustomerData>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => prev.map(customer => customer.id === id ? data : customer));
      toast({
        title: "Customer updated",
        description: "Customer has been updated successfully.",
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating customer",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      // Check if customer has orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', id)
        .limit(1);

      if (ordersError) throw ordersError;

      if (orders && orders.length > 0) {
        toast({
          title: "Cannot delete customer",
          description: "This customer has existing orders and cannot be deleted.",
          variant: "destructive",
        });
        return { error: new Error("Customer has existing orders") };
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== id));
      setCustomersWithOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast({
        title: "Customer deleted",
        description: "Customer has been deleted successfully.",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error deleting customer",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
    customersWithOrders,
  };
}