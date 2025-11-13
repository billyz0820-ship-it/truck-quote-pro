export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string
          address_type: string
          city: string
          contact_email: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean | null
          location_type: string
          name: string
          notes: string | null
          state: string
          updated_at: string
          zip: string
        }
        Insert: {
          address: string
          address_type: string
          city: string
          contact_email?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean | null
          location_type: string
          name: string
          notes?: string | null
          state: string
          updated_at?: string
          zip: string
        }
        Update: {
          address?: string
          address_type?: string
          city?: string
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean | null
          location_type?: string
          name?: string
          notes?: string | null
          state?: string
          updated_at?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bill_month: string
          bill_number: string
          created_at: string
          customer_id: string
          id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          bill_month: string
          bill_number: string
          created_at?: string
          customer_id: string
          id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          bill_month?: string
          bill_number?: string
          created_at?: string
          customer_id?: string
          id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_imports: {
        Row: {
          actual_cost: number
          carrier_name: string | null
          created_at: string
          created_by: string
          id: string
          import_date: string
          notes: string | null
          order_number: string
          payment_method: string | null
          reference_number: string | null
        }
        Insert: {
          actual_cost: number
          carrier_name?: string | null
          created_at?: string
          created_by: string
          id?: string
          import_date: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Update: {
          actual_cost?: number
          carrier_name?: string | null
          created_at?: string
          created_by?: string
          id?: string
          import_date?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          amount: number
          coupon_code: string
          created_at: string
          created_by: string
          customer_id: string | null
          expire_at: string | null
          id: string
          status: string
          used_at: string | null
          voided_at: string | null
        }
        Insert: {
          amount: number
          coupon_code: string
          created_at?: string
          created_by: string
          customer_id?: string | null
          expire_at?: string | null
          id?: string
          status?: string
          used_at?: string | null
          voided_at?: string | null
        }
        Update: {
          amount?: number
          coupon_code?: string
          created_at?: string
          created_by?: string
          customer_id?: string | null
          expire_at?: string | null
          id?: string
          status?: string
          used_at?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_users: {
        Row: {
          customer_id: string
          id: string
          user_id: string
        }
        Insert: {
          customer_id: string
          id?: string
          user_id: string
        }
        Update: {
          customer_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_users_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          balance: number | null
          commission_type: string | null
          commission_value: number | null
          company_address: string | null
          company_name: string
          created_at: string
          credit_limit: number | null
          customer_code: string
          customer_type: Database["public"]["Enums"]["customer_type"]
          id: string
          last_login_at: string | null
          payment_due_date: string | null
          payment_terms: number | null
          status: Database["public"]["Enums"]["customer_status"]
          updated_at: string
        }
        Insert: {
          balance?: number | null
          commission_type?: string | null
          commission_value?: number | null
          company_address?: string | null
          company_name: string
          created_at?: string
          credit_limit?: number | null
          customer_code: string
          customer_type?: Database["public"]["Enums"]["customer_type"]
          id?: string
          last_login_at?: string | null
          payment_due_date?: string | null
          payment_terms?: number | null
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
        }
        Update: {
          balance?: number | null
          commission_type?: string | null
          commission_value?: number | null
          company_address?: string | null
          company_name?: string
          created_at?: string
          credit_limit?: number | null
          customer_code?: string
          customer_type?: Database["public"]["Enums"]["customer_type"]
          id?: string
          last_login_at?: string | null
          payment_due_date?: string | null
          payment_terms?: number | null
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
        }
        Relationships: []
      }
      email_bindings: {
        Row: {
          created_at: string
          customer_id: string
          email: string
          email_type: string
          enabled: boolean
          id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          email: string
          email_type?: string
          enabled?: boolean
          id?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string
          email_type?: string
          enabled?: boolean
          id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          description: string | null
          expense_date: string
          id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          expense_date: string
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          created_by: string
          end_time: string | null
          id: string
          media_urls: Json | null
          notification_type: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          end_time?: string | null
          id?: string
          media_urls?: Json | null
          notification_type?: string
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          end_time?: string | null
          id?: string
          media_urls?: Json | null
          notification_type?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          actual_cost: number | null
          bol_number: string | null
          bol_url: string | null
          cargo_description: string | null
          carrier_name: string | null
          created_at: string
          customer_code: string
          customer_id: string
          delivery_address: string | null
          delivery_address_type: string | null
          delivery_city: string | null
          delivery_contact_email: string | null
          delivery_contact_name: string | null
          delivery_contact_phone: string | null
          delivery_notes: string | null
          delivery_state: string | null
          delivery_zip: string
          id: string
          order_number: string
          pallet_label_url: string | null
          pickup_address: string | null
          pickup_address_type: string | null
          pickup_city: string | null
          pickup_contact_email: string | null
          pickup_contact_name: string | null
          pickup_contact_phone: string | null
          pickup_notes: string | null
          pickup_state: string | null
          pickup_zip: string
          pro_number: string | null
          profit: number | null
          quoted_amount: number
          reference_number: string | null
          sbol_url: string | null
          shipment_type: string | null
          sku: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          bol_number?: string | null
          bol_url?: string | null
          cargo_description?: string | null
          carrier_name?: string | null
          created_at?: string
          customer_code: string
          customer_id: string
          delivery_address?: string | null
          delivery_address_type?: string | null
          delivery_city?: string | null
          delivery_contact_email?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_notes?: string | null
          delivery_state?: string | null
          delivery_zip: string
          id?: string
          order_number: string
          pallet_label_url?: string | null
          pickup_address?: string | null
          pickup_address_type?: string | null
          pickup_city?: string | null
          pickup_contact_email?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_notes?: string | null
          pickup_state?: string | null
          pickup_zip: string
          pro_number?: string | null
          profit?: number | null
          quoted_amount: number
          reference_number?: string | null
          sbol_url?: string | null
          shipment_type?: string | null
          sku?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          bol_number?: string | null
          bol_url?: string | null
          cargo_description?: string | null
          carrier_name?: string | null
          created_at?: string
          customer_code?: string
          customer_id?: string
          delivery_address?: string | null
          delivery_address_type?: string | null
          delivery_city?: string | null
          delivery_contact_email?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_notes?: string | null
          delivery_state?: string | null
          delivery_zip?: string
          id?: string
          order_number?: string
          pallet_label_url?: string | null
          pickup_address?: string | null
          pickup_address_type?: string | null
          pickup_city?: string | null
          pickup_contact_email?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_notes?: string | null
          pickup_state?: string | null
          pickup_zip?: string
          pro_number?: string | null
          profit?: number | null
          quoted_amount?: number
          reference_number?: string | null
          sbol_url?: string | null
          shipment_type?: string | null
          sku?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_vouchers: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          processed_at: string | null
          processed_by: string | null
          status: string
          voucher_url: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          voucher_url: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          voucher_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_vouchers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_orders: {
        Row: {
          id: string
          order_date: string
          order_id: string
          platform_name: string
        }
        Insert: {
          id?: string
          order_date?: string
          order_id: string
          platform_name: string
        }
        Update: {
          id?: string
          order_date?: string
          order_id?: string
          platform_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rebills: {
        Row: {
          actual_amount: number
          base_fee: number | null
          carrier_name: string | null
          created_at: string
          created_by: string
          customer_id: string
          difference: number
          fee_type: string | null
          fuel_surcharge: number | null
          id: string
          long_haul_fee: number | null
          order_id: string
          original_amount: number
          other_fees: number | null
          platform_name: string | null
        }
        Insert: {
          actual_amount: number
          base_fee?: number | null
          carrier_name?: string | null
          created_at?: string
          created_by: string
          customer_id: string
          difference: number
          fee_type?: string | null
          fuel_surcharge?: number | null
          id?: string
          long_haul_fee?: number | null
          order_id: string
          original_amount: number
          other_fees?: number | null
          platform_name?: string | null
        }
        Update: {
          actual_amount?: number
          base_fee?: number | null
          carrier_name?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          difference?: number
          fee_type?: string | null
          fuel_surcharge?: number | null
          id?: string
          long_haul_fee?: number | null
          order_id?: string
          original_amount?: number
          other_fees?: number | null
          platform_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rebills_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_accounts: {
        Row: {
          created_at: string
          customer_permissions: Json | null
          email: string
          feature_permissions: Json | null
          id: string
          phone: string | null
          role: string
          status: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          customer_permissions?: Json | null
          email: string
          feature_permissions?: Json | null
          id?: string
          phone?: string | null
          role: string
          status?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          customer_permissions?: Json | null
          email?: string
          feature_permissions?: Json | null
          id?: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      temporary_credits: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          customer_id: string
          id: string
          valid_until: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          customer_id: string
          id?: string
          valid_until: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          valid_until?: string
        }
        Relationships: []
      }
      ticket_communications: {
        Row: {
          created_at: string
          id: string
          message: string
          ticket_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          ticket_id: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          ticket_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_communications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          carrier_name: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          description: string
          id: string
          order_number: string | null
          priority: string
          resolved_at: string | null
          status: string
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          carrier_name?: string | null
          created_at?: string
          created_by: string
          customer_id?: string | null
          description: string
          id?: string
          order_number?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          ticket_number: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          carrier_name?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          description?: string
          id?: string
          order_number?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_customer_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      customer_status: "active" | "frozen"
      customer_type: "prepaid" | "credit"
      payment_method: "bank_transfer" | "credit_card" | "paypal" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      customer_status: ["active", "frozen"],
      customer_type: ["prepaid", "credit"],
      payment_method: ["bank_transfer", "credit_card", "paypal", "other"],
    },
  },
} as const
