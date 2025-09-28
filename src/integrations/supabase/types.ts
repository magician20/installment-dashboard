export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone_number: string | null
          address: string | null
          identity_number: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone_number?: string | null
          address?: string | null
          identity_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone_number?: string | null
          address?: string | null
          identity_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          cost: number
          quantity: number
          category_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          quantity?: number
          category_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          quantity?: number
          category_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      installment_plans: {
        Row: {
          id: string
          name: string
          duration: number
          interest_rate: number
          grace_period: number
          plan_type: 'fixed' | 'flexible'
          advance_payment_amount: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          duration: number
          interest_rate?: number
          grace_period?: number
          plan_type: 'fixed' | 'flexible'
          advance_payment_amount?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          duration?: number
          interest_rate?: number
          grace_period?: number
          plan_type?: 'fixed' | 'flexible'
          advance_payment_amount?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          order_date: string
          status: string
          total_amount: number
          payment_method: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          order_date?: string
          status?: string
          total_amount: number
          payment_method: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          order_date?: string
          status?: string
          total_amount?: number
          payment_method?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      installments: {
        Row: {
          id: string
          order_id: string
          installment_plan_id: string
          installment_number: string
          due_date: string
          amount: number
          status: string
          late_fee: number | null
          payment_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          installment_plan_id: string
          installment_number: string
          due_date: string
          amount: number
          status?: string
          late_fee?: number | null
          payment_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          installment_plan_id?: string
          installment_number?: string
          due_date?: string
          amount?: number
          status?: string
          late_fee?: number | null
          payment_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string | null
          installment_id: string | null
          amount: number
          payment_date: string
          payment_method: string
          reference_number: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          installment_id?: string | null
          amount: number
          payment_date: string
          payment_method: string
          reference_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          installment_id?: string | null
          amount?: number
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      //77
      create_installments_for_order: {
        Args: {
          p_order_id: string
          p_plan_id: string
          p_start_date: string
        }
        Returns: Json
      }
      //284
      process_payment: {
        Args: {
          p_order_id: string
          p_amount: number
          p_payment_method: string
          p_installment_id: string
          p_reference_number?: string
          p_notes?: string
        }
        Returns: Json
      }
      //152
      refresh_installment_late_status: {
        Args: {
          p_installment_id: string
        }
        Returns: Json
      }
      //24
      update_overdue_installments: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      // New financial metrics functions
      get_financial_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Array<{
          total_sales: number
          total_cost: number
          profit: number
          total_paid_installments: number
          remaining_installments_amount: number
          total_orders: number
          total_installments: number
          pending_installments_count: number
          total_products: number
          total_customers: number
          total_categories: number
        }>
      }
      get_recent_orders: {
        Args: {
          limit_count?: number
        }
        Returns: Array<{
          id: string
          customer_name: string
          total_amount: number
          status: string
          order_date: string
        }>
      }
      get_pending_installments: {
        Args: {
          limit_count?: number
        }
        Returns: Array<{
          id: string
          customer_name: string
          amount: number
          due_date: string
          status: string
          installment_number: string
        }>
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never
