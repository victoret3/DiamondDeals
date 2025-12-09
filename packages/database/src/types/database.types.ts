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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: "admin" | "player"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: "admin" | "player"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: "admin" | "player"
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          player_code: string
          user_id: string | null
          full_name: string
          email: string | null
          phone: string | null
          status: "pending" | "active" | "inactive"
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_code: string
          user_id?: string | null
          full_name: string
          email?: string | null
          phone?: string | null
          status?: "pending" | "active" | "inactive"
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_code?: string
          user_id?: string | null
          full_name?: string
          email?: string | null
          phone?: string | null
          status?: "pending" | "active" | "inactive"
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clubs: {
        Row: {
          id: string
          name: string
          code: string
          base_rakeback_percentage: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          base_rakeback_percentage: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          base_rakeback_percentage?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      player_clubs: {
        Row: {
          id: string
          player_id: string
          club_id: string
          username_in_club: string | null
          joined_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          player_id: string
          club_id: string
          username_in_club?: string | null
          joined_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          player_id?: string
          club_id?: string
          username_in_club?: string | null
          joined_at?: string
          is_active?: boolean
        }
      }
      condition_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
      }
      condition_rules: {
        Row: {
          id: string
          template_id: string
          ratio_min: number
          ratio_max: number | null
          hands_min: number
          hands_max: number | null
          rakeback_percentage: number
          priority: number
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          ratio_min: number
          ratio_max?: number | null
          hands_min: number
          hands_max?: number | null
          rakeback_percentage: number
          priority?: number
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          ratio_min?: number
          ratio_max?: number | null
          hands_min?: number
          hands_max?: number | null
          rakeback_percentage?: number
          priority?: number
          created_at?: string
        }
      }
      player_conditions: {
        Row: {
          id: string
          player_club_id: string
          condition_type: "fixed" | "dynamic"
          fixed_percentage: number | null
          template_id: string | null
          valid_from: string
          valid_until: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_club_id: string
          condition_type: "fixed" | "dynamic"
          fixed_percentage?: number | null
          template_id?: string | null
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_club_id?: string
          condition_type?: "fixed" | "dynamic"
          fixed_percentage?: number | null
          template_id?: string | null
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      player_stats: {
        Row: {
          id: string
          player_club_id: string
          period_start: string
          period_end: string
          hands_played: number
          total_rake: number
          total_result: number
          ratio: number
          club_rakeback_amount: number
          diamont_rakeback_amount: number
          applied_rakeback_percentage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_club_id: string
          period_start: string
          period_end: string
          hands_played?: number
          total_rake?: number
          total_result?: number
          ratio?: number
          club_rakeback_amount?: number
          diamont_rakeback_amount?: number
          applied_rakeback_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_club_id?: string
          period_start?: string
          period_end?: string
          hands_played?: number
          total_rake?: number
          total_result?: number
          ratio?: number
          club_rakeback_amount?: number
          diamont_rakeback_amount?: number
          applied_rakeback_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
