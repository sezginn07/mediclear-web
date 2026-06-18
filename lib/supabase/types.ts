// Supabase database type definitions — kept in sync with lib/supabase/schema.sql.
// Prefer re-generating from the live project when possible:
//   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          is_premium: boolean;
          premium_expires_at: string | null;
          analysis_count_monthly: number;
          analysis_reset_date: string;
          email_confirmed: boolean;
          kvkk_consent: boolean;
          referred_by: string | null;
          referral_count: number;
          bonus_analyses: number;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          analysis_count_monthly?: number;
          analysis_reset_date?: string;
          email_confirmed?: boolean;
          kvkk_consent?: boolean;
          referred_by?: string | null;
          referral_count?: number;
          bonus_analyses?: number;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          analysis_count_monthly?: number;
          analysis_reset_date?: string;
          email_confirmed?: boolean;
          kvkk_consent?: boolean;
          referred_by?: string | null;
          referral_count?: number;
          bonus_analyses?: number;
        };
        Relationships: [];
      };
      analyses: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          report_name: string;
          category: string;
          language: string;
          status: string;
          summary: string;
          key_findings: string[];
          doctor_questions: string[];
          do_list: string[];
          dont_list: string[];
          urgency: string | null;
          disclaimer: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          report_name: string;
          category: string;
          language?: string;
          status: string;
          summary: string;
          key_findings?: string[];
          doctor_questions?: string[];
          do_list?: string[];
          dont_list?: string[];
          urgency?: string | null;
          disclaimer?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          report_name?: string;
          category?: string;
          language?: string;
          status?: string;
          summary?: string;
          key_findings?: string[];
          doctor_questions?: string[];
          do_list?: string[];
          dont_list?: string[];
          urgency?: string | null;
          disclaimer?: string | null;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          ip_hash: string;
          count: number;
          window_start: string;
        };
        Insert: {
          ip_hash: string;
          count?: number;
          window_start?: string;
        };
        Update: {
          ip_hash?: string;
          count?: number;
          window_start?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_rate_limit: {
        Args: { p_ip_hash: string; p_max?: number; p_window_seconds?: number };
        Returns: boolean;
      };
      increment_analysis_count: {
        Args: { p_user_id: string; p_limit: number };
        Returns: boolean;
      };
      decrement_analysis_count: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type Analysis = Database['public']['Tables']['analyses']['Row'];
export type AnalysisInsert = Database['public']['Tables']['analyses']['Insert'];
