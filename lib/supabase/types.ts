export type RestaurantStatus = "active" | "past_due" | "blocked" | "canceled"
export type UserRole = "master" | "restaurant_admin"
export type MediaType = "video" | "image"
export type OrderStatus = "received" | "preparing" | "ready" | "delivered" | "canceled"
export type WaiterCallStatus = "open" | "attended"
export type EventType = "view" | "add_to_cart" | "order"
export type PaymentMethod = "card" | "pix"

export interface Database {
  public: {
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
        Insert: Omit<Database["public"]["Tables"]["restaurants"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Insert"]>
      }
      profiles: {
        Row: {
          user_id: string
          role: UserRole
          restaurant_id: string | null
        }
        Insert: Database["public"]["Tables"]["profiles"]["Row"]
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>
      }
      plans: {
        Row: {
          id: string
          name: string
          price_cents: number
          has_orders: boolean
        }
        Insert: Omit<Database["public"]["Tables"]["plans"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>
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
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>
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
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>
      }
      categories: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          sort_order: number
        }
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>
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
        Insert: Omit<Database["public"]["Tables"]["dishes"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["dishes"]["Insert"]>
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
        Insert: Omit<Database["public"]["Tables"]["events"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>
      }
      likes: {
        Row: {
          dish_id: string
          session_id: string
          restaurant_id: string
        }
        Insert: Database["public"]["Tables"]["likes"]["Row"]
        Update: Partial<Database["public"]["Tables"]["likes"]["Row"]>
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
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>
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
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>
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
        Insert: Omit<Database["public"]["Tables"]["waiter_calls"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["waiter_calls"]["Insert"]>
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
        Insert: Omit<Database["public"]["Tables"]["cost_entries"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["cost_entries"]["Insert"]>
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
        Insert: Omit<Database["public"]["Tables"]["usage_snapshots"]["Row"], "id"> & { id?: string }
        Update: Partial<Database["public"]["Tables"]["usage_snapshots"]["Insert"]>
      }
    }
    Functions: {
      get_my_role: { Args: Record<string, never>; Returns: UserRole | null }
      get_my_restaurant_id: { Args: Record<string, never>; Returns: string | null }
    }
  }
}
