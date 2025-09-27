import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  order_date: string;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateOrderData {
  customer_id: string;
  total_amount: number;
  payment_method: string;
  status: string;
  order_date?: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers!inner(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = data?.map(order => ({
        ...order,
        customer: {
          first_name: order.customers.first_name,
          last_name: order.customers.last_name,
          email: order.customers.email,
        }
      })) || [];
      
      setOrders(transformedData);
    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: CreateOrderData) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select(`
          *,
          customers!inner(first_name, last_name, email)
        `)
        .single();

      if (error) throw error;
      
      const transformedData = {
        ...data,
        customer: {
          first_name: data.customers.first_name,
          last_name: data.customers.last_name,
          email: data.customers.email,
        }
      };
      
      setOrders(prev => [transformedData, ...prev]);
      toast({
        title: "Order created",
        description: "Order has been created successfully.",
      });
      return { data: transformedData, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating order",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateOrder = async (id: string, orderData: Partial<CreateOrderData>) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(orderData)
        .eq('id', id)
        .select(`
          *,
          customers!inner(first_name, last_name, email)
        `)
        .single();

      if (error) throw error;

      const transformedData = {
        ...data,
        customer: {
          first_name: data.customers.first_name,
          last_name: data.customers.last_name,
          email: data.customers.email,
        }
      };

      setOrders(prev => prev.map(order => order.id === id ? transformedData : order));
      toast({
        title: "Order updated",
        description: "Order has been updated successfully.",
      });
      return { data: transformedData, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOrders(prev => prev.filter(order => order.id !== id));
      toast({
        title: "Order deleted",
        description: "Order has been deleted successfully.",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error deleting order",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    createOrder,
    updateOrder,
    deleteOrder,
    refetch: fetchOrders,
  };
}