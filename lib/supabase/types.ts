export type RestaurantStatus = "active" | "past_due" | "blocked" | "canceled"
export type UserRole = "master" | "restaurant_admin"
export type MediaType = "video" | "image"
export type OrderStatus = "received" | "preparing" | "ready" | "delivered" | "canceled"
export type WaiterCallStatus = "open" | "attended"
export type EventType = "view" | "add_to_cart" | "order"
export type PaymentMethod = "card" | "pix"

type R = { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }

export interface Database {
  public: {
    Views: { [_ in never]: never }
    Enums: {
      user_role: "master" | "restaurant_admin"
      media_type: "image" | "video"
      order_status: "received" | "preparing" | "ready" | "delivered" | "canceled"
      event_type: "view" | "add_to_cart" | "order"
      payment_method: "card" | "pix"
      restaurant_status: "active" | "past_due" | "blocked" | "canceled"
      waiter_call_status: "open" | "attended"
    }
    CompositeTypes: { [_ in never]: never }
    Tables: {
      restaurants: {
        Row: {
          id: string
          slug: string
          name: string
          status: RestaurantStatus
          plan_id: string
          tables_count: number
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          status?: RestaurantStatus
          plan_id: string
          tables_count?: number
          logo_url?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Insert"]>
        Relationships: R[]
      }
      profiles: {
        Row: {
          user_id: string
          role: UserRole
          restaurant_id: string | null
        }
        Insert: {
          user_id: string
          role: UserRole
          restaurant_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: R[]
      }
      plans: {
        Row: {
          id: string
          name: string
          price_cents: number
          has_orders: boolean
        }
        Insert: {
          id?: string
          name: string
          price_cents: number
          has_orders?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>
        Relationships: R[]
      }
      subscriptions: {
        Row: {
          id: string
          restaurant_id: string
          plan_id: string
          payment_method: PaymentMethod
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          due_date: string
          grace_days: number
          status: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          plan_id: string
          payment_method: PaymentMethod
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          due_date: string
          grace_days?: number
          status: string
        }
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>
        Relationships: R[]
      }
      payments: {
        Row: {
          id: string
          restaurant_id: string
          gateway_payment_id: string | null
          amount_cents: number
          status: string
          due_date: string
          paid_at: string | null
          payment_link_url: string | null
        }
        Insert: {
          id?: string
          restaurant_id: string
          gateway_payment_id?: string | null
          amount_cents: number
          status: string
          due_date: string
          paid_at?: string | null
          payment_link_url?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>
        Relationships: R[]
      }
      categories: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          sort_order?: number
        }
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>
        Relationships: R[]
      }
      dishes: {
        Row: {
          id: string
          restaurant_id: string
          category_id: string
          name: string
          description: string | null
          ingredients: string | null
          serves: number | null
          prep_time_min: number | null
          price_cents: number
          media_type: MediaType
          bunny_video_id: string | null
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          restaurant_id: string
          category_id: string
          name: string
          description?: string | null
          ingredients?: string | null
          serves?: number | null
          prep_time_min?: number | null
          price_cents: number
          media_type: MediaType
          bunny_video_id?: string | null
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          sort_order?: number
        }
        Update: Partial<Database["public"]["Tables"]["dishes"]["Insert"]>
        Relationships: R[]
      }
      events: {
        Row: {
          id: string
          restaurant_id: string
          dish_id: string
          session_id: string
          type: EventType
          duration_ms: number | null
          completed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          dish_id: string
          session_id: string
          type: EventType
          duration_ms?: number | null
          completed?: boolean | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>
        Relationships: R[]
      }
      likes: {
        Row: {
          dish_id: string
          session_id: string
          restaurant_id: string
        }
        Insert: {
          dish_id: string
          session_id: string
          restaurant_id: string
        }
        Update: Partial<Database["public"]["Tables"]["likes"]["Insert"]>
        Relationships: R[]
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          customer_name: string
          table_number: number
          status: OrderStatus
          total_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          customer_name: string
          table_number: number
          status?: OrderStatus
          total_cents: number
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>
        Relationships: R[]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          dish_id: string
          name_snapshot: string
          unit_price_cents: number
          quantity: number
        }
        Insert: {
          id?: string
          order_id: string
          dish_id: string
          name_snapshot: string
          unit_price_cents: number
          quantity: number
        }
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>
        Relationships: R[]
      }
      waiter_calls: {
        Row: {
          id: string
          restaurant_id: string
          table_number: number
          session_id: string | null
          status: WaiterCallStatus
          created_at: string
          attended_at: string | null
        }
        Insert: {
          id?: string
          restaurant_id: string
          table_number: number
          session_id?: string | null
          status?: WaiterCallStatus
          created_at?: string
          attended_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["waiter_calls"]["Insert"]>
        Relationships: R[]
      }
      cost_entries: {
        Row: {
          id: string
          provider: string
          description: string
          amount_cents: number
          month: string
          created_at: string
        }
        Insert: {
          id?: string
          provider: string
          description: string
          amount_cents: number
          month: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["cost_entries"]["Insert"]>
        Relationships: R[]
      }
      usage_snapshots: {
        Row: {
          id: string
          restaurant_id: string | null
          provider: string
          metric: string
          value: number
          recorded_at: string
        }
        Insert: {
          id?: string
          restaurant_id?: string | null
          provider: string
          metric: string
          value: number
          recorded_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["usage_snapshots"]["Insert"]>
        Relationships: R[]
      }
    }
    Functions: {
      get_my_role: { Args: Record<string, never>; Returns: UserRole | null }
      get_my_restaurant_id: { Args: Record<string, never>; Returns: string | null }
      rpc_toggle_like: { Args: { p_dish_id: string; p_session_id: string }; Returns: boolean }
      rpc_batch_events: { Args: { p_events: string }; Returns: void }
    }
  }
}
