// Supabase database type definitions.
// Re-generate with: npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts

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
          stripe_customer_id: string | null;
          analysis_count_monthly: number;
          analysis_reset_date: string;
          email_confirmed: boolean;
          kvkk_consent: boolean;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          stripe_customer_id?: string | null;
          analysis_count_monthly?: number;
          analysis_reset_date?: string;
          email_confirmed?: boolean;
          kvkk_consent?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          stripe_customer_id?: string | null;
          analysis_count_monthly?: number;
          analysis_reset_date?: string;
          email_confirmed?: boolean;
          kvkk_consent?: boolean;
        };
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
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type Analysis = Database['public']['Tables']['analyses']['Row'];
export type AnalysisInsert = Database['public']['Tables']['analyses']['Insert'];
