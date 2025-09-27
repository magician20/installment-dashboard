import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  category_id: string;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
  };
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category_id: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = data?.map(product => ({
        ...product,
        category: { name: product.categories.name }
      })) || [];
      
      setProducts(transformedData);
    } catch (error: any) {
      toast({
        title: "Error fetching products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: CreateProductData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select(`
          *,
          categories!inner(name)
        `)
        .single();

      if (error) throw error;
      
      const transformedData = {
        ...data,
        category: { name: data.categories.name }
      };
      
      setProducts(prev => [transformedData, ...prev]);
      toast({
        title: "Product created",
        description: `Product "${productData.name}" has been created successfully.`,
      });
      return { data: transformedData, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating product",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateProduct = async (id: string, productData: Partial<CreateProductData>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select(`
          *,
          categories!inner(name)
        `)
        .single();

      if (error) throw error;

      const transformedData = {
        ...data,
        category: { name: data.categories.name }
      };

      setProducts(prev => prev.map(product => product.id === id ? transformedData : product));
      toast({
        title: "Product updated",
        description: "Product has been updated successfully.",
      });
      return { data: transformedData, error: null };
    } catch (error: any) {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== id));
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully.",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}