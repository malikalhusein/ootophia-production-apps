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
      batches: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          start_date: string
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          start_date?: string
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          start_date?: string
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_products: {
        Row: {
          bundle_id: string
          product_id: string
        }
        Insert: {
          bundle_id: string
          product_id: string
        }
        Update: {
          bundle_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_products_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string | null
          custom_price: number
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_price: number
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_price?: number
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_member: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_member?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_member?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          date: string
          description: string | null
          id: string
          invoice_number: string
          items: Json
          status: string
          subtotal: number
          total: number
          transaction_ids: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          date: string
          description?: string | null
          id?: string
          invoice_number: string
          items?: Json
          status: string
          subtotal?: number
          total?: number
          transaction_ids?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          date?: string
          description?: string | null
          id?: string
          invoice_number?: string
          items?: Json
          status?: string
          subtotal?: number
          total?: number
          transaction_ids?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      lineups: {
        Row: {
          batch_id: string | null
          category: string
          created_at: string | null
          green_beans_price: number | null
          green_beans_shipping: number | null
          harvest_season: string | null
          id: string
          initial_weight: number
          lineup_code: string | null
          name: string
          origin: string | null
          process: string | null
          processing_method: string | null
          processor: string | null
          promo_allocation: number | null
          promo_allocation_used: number | null
          purchase_date: string
          rnd_allocation: number | null
          rnd_allocation_used: number | null
          roaster: string | null
          roasting_service: number | null
          roasting_service_type: string
          roasting_transport: number | null
          tasting_notes: string | null
          tea_grade: string | null
          tea_type: string | null
          updated_at: string | null
          user_id: string
          variety: string | null
        }
        Insert: {
          batch_id?: string | null
          category?: string
          created_at?: string | null
          green_beans_price?: number | null
          green_beans_shipping?: number | null
          harvest_season?: string | null
          id?: string
          initial_weight: number
          lineup_code?: string | null
          name: string
          origin?: string | null
          process?: string | null
          processing_method?: string | null
          processor?: string | null
          promo_allocation?: number | null
          promo_allocation_used?: number | null
          purchase_date: string
          rnd_allocation?: number | null
          rnd_allocation_used?: number | null
          roaster?: string | null
          roasting_service?: number | null
          roasting_service_type?: string
          roasting_transport?: number | null
          tasting_notes?: string | null
          tea_grade?: string | null
          tea_type?: string | null
          updated_at?: string | null
          user_id: string
          variety?: string | null
        }
        Update: {
          batch_id?: string | null
          category?: string
          created_at?: string | null
          green_beans_price?: number | null
          green_beans_shipping?: number | null
          harvest_season?: string | null
          id?: string
          initial_weight?: number
          lineup_code?: string | null
          name?: string
          origin?: string | null
          process?: string | null
          processing_method?: string | null
          processor?: string | null
          promo_allocation?: number | null
          promo_allocation_used?: number | null
          purchase_date?: string
          rnd_allocation?: number | null
          rnd_allocation_used?: number | null
          roaster?: string | null
          roasting_service?: number | null
          roasting_service_type?: string
          roasting_transport?: number | null
          tasting_notes?: string | null
          tea_grade?: string | null
          tea_type?: string | null
          updated_at?: string | null
          user_id?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lineups_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          id: string
          label_cost: number | null
          lineup_id: string
          margin_percentage: number | null
          marketing_cost: number | null
          name: string
          net_weight: number
          packaging_cost: number | null
          stock: number | null
          stock_threshold: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label_cost?: number | null
          lineup_id: string
          margin_percentage?: number | null
          marketing_cost?: number | null
          name: string
          net_weight: number
          packaging_cost?: number | null
          stock?: number | null
          stock_threshold?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label_cost?: number | null
          lineup_id?: string
          margin_percentage?: number | null
          marketing_cost?: number | null
          name?: string
          net_weight?: number
          packaging_cost?: number | null
          stock?: number | null
          stock_threshold?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_lineup_id_fkey"
            columns: ["lineup_id"]
            isOneToOne: false
            referencedRelation: "lineups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          id: string
          logo: string | null
          payment_methods: Json | null
          phone: string | null
          theme_hue: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          logo?: string | null
          payment_methods?: Json | null
          phone?: string | null
          theme_hue?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          payment_methods?: Json | null
          phone?: string | null
          theme_hue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roast_logs: {
        Row: {
          created_at: string | null
          date: string
          id: string
          input_weight: number
          lineup_id: string
          output_weight: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          input_weight: number
          lineup_id: string
          output_weight: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          input_weight?: number
          lineup_id?: string
          output_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "roast_logs_lineup_id_fkey"
            columns: ["lineup_id"]
            isOneToOne: false
            referencedRelation: "lineups"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjustment_type: string
          created_at: string
          id: string
          new_stock: number
          previous_stock: number
          product_id: string
          reason: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          adjustment_type: string
          created_at?: string
          id?: string
          new_stock: number
          previous_stock: number
          product_id: string
          reason?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          adjustment_type?: string
          created_at?: string
          id?: string
          new_stock?: number
          previous_stock?: number
          product_id?: string
          reason?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          bundle_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          lineup_id: string | null
          product_id: string | null
          quantity: number
          status: string
          total_value: number
          user_id: string
        }
        Insert: {
          bundle_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          lineup_id?: string | null
          product_id?: string | null
          quantity: number
          status: string
          total_value: number
          user_id: string
        }
        Update: {
          bundle_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          lineup_id?: string | null
          product_id?: string | null
          quantity?: number
          status?: string
          total_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_lineup_id_fkey"
            columns: ["lineup_id"]
            isOneToOne: false
            referencedRelation: "lineups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
