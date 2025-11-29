export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string
          name: string
          description: string | null
          contact_name: string | null
          contact_phone: string | null
          share_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          share_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          share_token?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          vendor_id: string
          amount: number
          description: string | null
          payment_method: 'card' | 'cash' | 'other'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          amount: number
          description?: string | null
          payment_method?: 'card' | 'cash' | 'other'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          amount?: number
          description?: string | null
          payment_method?: 'card' | 'cash' | 'other'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_requests: {
        Row: {
          id: string
          vendor_id: string
          amount: number
          payer_name: string
          status: 'pending' | 'completed' | 'cancelled'
          processed_transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          amount: number
          payer_name: string
          status?: 'pending' | 'completed' | 'cancelled'
          processed_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          amount?: number
          payer_name?: string
          status?: 'pending' | 'completed' | 'cancelled'
          processed_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_processed_transaction_id_fkey"
            columns: ["processed_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          }
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

export type Vendor = Database['public']['Tables']['vendors']['Row']
export type VendorInsert = Database['public']['Tables']['vendors']['Insert']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type PaymentRequest = Database['public']['Tables']['payment_requests']['Row']
export type PaymentRequestInsert = Database['public']['Tables']['payment_requests']['Insert']
