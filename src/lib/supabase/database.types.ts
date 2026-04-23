export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          name_ja: string | null;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          name_ja?: string | null;
          icon?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          name_ja: string | null;
          description: string;
          price: number;
          image: string;
          available: boolean;
          tags: string[];
          spicy: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          category_id: string;
          name: string;
          name_ja?: string | null;
          description?: string;
          price: number;
          image?: string;
          available?: boolean;
          tags?: string[];
          spicy?: number;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          table_number: string;
          subtotal: number;
          service_charge: number;
          tax: number;
          total: number;
          status:
            | "pending"
            | "confirmed"
            | "preparing"
            | "ready"
            | "served"
            | "paid"
            | "cancelled";
          payment_status: "unpaid" | "paid" | "refunded";
          payment_method:
            | "card"
            | "applepay"
            | "grabpay"
            | "fpx"
            | "tng"
            | "cash"
            | null;
          notes: string | null;
          cancel_reason: string | null;
          stripe_payment_intent_id: string | null;
          stripe_refund_id: string | null;
          confirmed_at: string | null;
          preparing_at: string | null;
          ready_at: string | null;
          served_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          table_number: string;
          subtotal: number;
          service_charge?: number;
          tax?: number;
          total: number;
          status?: Database["public"]["Tables"]["orders"]["Row"]["status"];
          payment_status?: Database["public"]["Tables"]["orders"]["Row"]["payment_status"];
          payment_method?: Database["public"]["Tables"]["orders"]["Row"]["payment_method"];
          notes?: string | null;
          cancel_reason?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_refund_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: number;
          order_id: string;
          menu_item_id: string | null;
          name: string;
          quantity: number;
          price_at_order: number;
          notes: string | null;
        };
        Insert: {
          order_id: string;
          menu_item_id?: string | null;
          name: string;
          quantity: number;
          price_at_order: number;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          user_id: string;
          role: "admin" | "chef";
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: "admin" | "chef";
          display_name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "served"
        | "paid"
        | "cancelled";
      payment_status: "unpaid" | "paid" | "refunded";
      payment_method: "card" | "applepay" | "grabpay" | "fpx" | "tng" | "cash";
    };
    CompositeTypes: Record<never, never>;
  };
};
