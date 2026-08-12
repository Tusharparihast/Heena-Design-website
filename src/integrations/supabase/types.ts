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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          contact: string
          created_at: string
          details: Json
          id: string
          kind: string
          locale: string
          name: string
          notes: string
          people: number
          reference_paths: string[]
          service: string
          source: string
          status: string
          trashed_at: string | null
        }
        Insert: {
          booking_date?: string
          booking_time?: string
          contact?: string
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          locale?: string
          name: string
          notes?: string
          people?: number
          reference_paths?: string[]
          service?: string
          source?: string
          status?: string
          trashed_at?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string
          contact?: string
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          locale?: string
          name?: string
          notes?: string
          people?: number
          reference_paths?: string[]
          service?: string
          source?: string
          status?: string
          trashed_at?: string | null
        }
        Relationships: []
      }
      order_requests: {
        Row: {
          address: string
          contact_method: string
          created_at: string
          customer_name: string
          delivery_method: string
          email: string
          id: string
          items: Json
          locale: string
          notes: string
          phone: string
          status: string
          total_npr: number | null
          trashed_at: string | null
          wechat: string
          whatsapp: string
        }
        Insert: {
          address?: string
          contact_method?: string
          created_at?: string
          customer_name: string
          delivery_method?: string
          email?: string
          id?: string
          items?: Json
          locale?: string
          notes?: string
          phone?: string
          status?: string
          total_npr?: number | null
          trashed_at?: string | null
          wechat?: string
          whatsapp?: string
        }
        Update: {
          address?: string
          contact_method?: string
          created_at?: string
          customer_name?: string
          delivery_method?: string
          email?: string
          id?: string
          items?: Json
          locale?: string
          notes?: string
          phone?: string
          status?: string
          total_npr?: number | null
          trashed_at?: string | null
          wechat?: string
          whatsapp?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_name: string
          account_number: string
          active: boolean
          created_at: string
          id: string
          instructions: string
          label: string
          qr_image: string
          sort_order: number
        }
        Insert: {
          account_name?: string
          account_number?: string
          active?: boolean
          created_at?: string
          id?: string
          instructions?: string
          label: string
          qr_image: string
          sort_order?: number
        }
        Update: {
          account_name?: string
          account_number?: string
          active?: boolean
          created_at?: string
          id?: string
          instructions?: string
          label?: string
          qr_image?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          builtin: boolean
          created_at: string
          deleted: boolean
          id: string
          name_en: string
          name_zh: string
        }
        Insert: {
          builtin?: boolean
          created_at?: string
          deleted?: boolean
          id: string
          name_en: string
          name_zh?: string
        }
        Update: {
          builtin?: boolean
          created_at?: string
          deleted?: boolean
          id?: string
          name_en?: string
          name_zh?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          body_en: string
          body_zh: string
          category: string
          created_at: string
          deleted: boolean
          discount_pct: number | null
          featured: boolean
          features_en: string[]
          features_zh: string[]
          gallery: string[]
          id: string
          image: string
          name_en: string
          name_zh: string
          price_npr: number
          stock: string
          updated_at: string
          usage_en: string[]
          usage_zh: string[]
          visible: boolean
        }
        Insert: {
          body_en?: string
          body_zh?: string
          category: string
          created_at?: string
          deleted?: boolean
          discount_pct?: number | null
          featured?: boolean
          features_en?: string[]
          features_zh?: string[]
          gallery?: string[]
          id: string
          image: string
          name_en: string
          name_zh?: string
          price_npr: number
          stock?: string
          updated_at?: string
          usage_en?: string[]
          usage_zh?: string[]
          visible?: boolean
        }
        Update: {
          body_en?: string
          body_zh?: string
          category?: string
          created_at?: string
          deleted?: boolean
          discount_pct?: number | null
          featured?: boolean
          features_en?: string[]
          features_zh?: string[]
          gallery?: string[]
          id?: string
          image?: string
          name_en?: string
          name_zh?: string
          price_npr?: number
          stock?: string
          updated_at?: string
          usage_en?: string[]
          usage_zh?: string[]
          visible?: boolean
        }
        Relationships: []
      }
      site_content: {
        Row: {
          created_at: string
          data: Json
          key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          default_locale: string
          id: string
          seo_default_description: string
          seo_ga_measurement_id: string
          seo_og_image: string
          seo_robots_index: boolean
          seo_search_console_verification: string
          seo_title_suffix: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_locale?: string
          id: string
          seo_default_description?: string
          seo_ga_measurement_id?: string
          seo_og_image?: string
          seo_robots_index?: boolean
          seo_search_console_verification?: string
          seo_title_suffix?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_locale?: string
          id?: string
          seo_default_description?: string
          seo_ga_measurement_id?: string
          seo_og_image?: string
          seo_robots_index?: boolean
          seo_search_console_verification?: string
          seo_title_suffix?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
