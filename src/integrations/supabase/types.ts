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
      create_installments_for_order: {
        Args: {
          p_order_id: string
          p_plan_id: string
          p_start_date: string
        }
        Returns: Json
      }
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
      refresh_installment_late_status: {
        Args: {
          p_installment_id: string
        }
        Returns: Json
      }
      update_overdue_installments: {
        Args: Record<PropertyKey, never>
        Returns: number
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
