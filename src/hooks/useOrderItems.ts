import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  products?: {
    name: string;
    description?: string;
  };
}

export interface CreateOrderItemData {
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function useOrderItems(orderId?: string) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrderItems = async (targetOrderId?: string) => {
    if (!targetOrderId && !orderId) return;
    
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products(name, description)
        `)
        .eq('order_id', targetOrderId || orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching order items",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrderItem = async (itemData: CreateOrderItemData) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .insert([itemData])
        .select(`
          *,
          products(name, description)
        `)
        .single();

      if (error) throw error;
      
      if (data) {
        setOrderItems(prev => [...prev, data]);
        toast({
          title: "Order item added",
          description: "Product has been added to the order.",
        });
      }
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error adding order item",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateOrderItem = async (id: string, itemData: Partial<CreateOrderItemData>) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .update(itemData)
        .eq('id', id)
        .select(`
          *,
          products(name, description)
        `)
        .single();

      if (error) throw error;

      if (data) {
        setOrderItems(prev => prev.map(item => item.id === id ? data : item));
        toast({
          title: "Order item updated",
          description: "Product quantity has been updated.",
        });
      }
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating order item",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteOrderItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOrderItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Order item removed",
        description: "Product has been removed from the order.",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error removing order item",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const createBulkOrderItems = async (items: CreateOrderItemData[]) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .insert(items)
        .select(`
          *,
          products(name, description)
        `);

      if (error) throw error;
      
      if (data) {
        setOrderItems(data);
        toast({
          title: "Order items added",
          description: `${data.length} products have been added to the order.`,
        });
      }
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error adding order items",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderItems(orderId);
    }
  }, [orderId]);

  return {
    orderItems,
    loading,
    createOrderItem,
    updateOrderItem,
    deleteOrderItem,
    createBulkOrderItems,
    refetch: fetchOrderItems,
  };
}