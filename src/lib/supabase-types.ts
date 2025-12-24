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
      admin_metrics: {
        Row: {
          active_users_month: number | null
          analyses_run: number | null
          avg_cost_per_analysis: number | null
          avg_response_time_ms: number | null
          churn_rate_percent: number | null
          conversion_edu_to_paid: number | null
          conversion_starter_to_pro: number | null
          created_at: string | null
          error_rate_percent: number | null
          id: string
          metric_date: string
          mrr_premium: number | null
          mrr_pro: number | null
          mrr_total: number | null
          new_signups_week: number | null
          total_users: number | null
          uptime_percent: number | null
        }
        Insert: {
          active_users_month?: number | null
          analyses_run?: number | null
          avg_cost_per_analysis?: number | null
          avg_response_time_ms?: number | null
          churn_rate_percent?: number | null
          conversion_edu_to_paid?: number | null
          conversion_starter_to_pro?: number | null
          created_at?: string | null
          error_rate_percent?: number | null
          id?: string
          metric_date: string
          mrr_premium?: number | null
          mrr_pro?: number | null
          mrr_total?: number | null
          new_signups_week?: number | null
          total_users?: number | null
          uptime_percent?: number | null
        }
        Update: {
          active_users_month?: number | null
          analyses_run?: number | null
          avg_cost_per_analysis?: number | null
          avg_response_time_ms?: number | null
          churn_rate_percent?: number | null
          conversion_edu_to_paid?: number | null
          conversion_starter_to_pro?: number | null
          created_at?: string | null
          error_rate_percent?: number | null
          id?: string
          metric_date?: string
          mrr_premium?: number | null
          mrr_pro?: number | null
          mrr_total?: number | null
          new_signups_week?: number | null
          total_users?: number | null
          uptime_percent?: number | null
        }
        Relationships: []
      }
      admin_alerts: {
        Row: {
          id: string
          alert_type: string
          severity: string
          title: string
          description: string | null
          source_slug: string | null
          metadata: Json
          is_read: boolean
          is_dismissed: boolean
          created_at: string
          triggered_at: string | null
          resolved_at: string | null
        }
        Insert: {
          id?: string
          alert_type: string
          severity: string
          title: string
          description?: string | null
          source_slug?: string | null
          metadata?: Json
          is_read?: boolean
          is_dismissed?: boolean
          created_at?: string
          triggered_at?: string | null
          resolved_at?: string | null
        }
        Update: {
          id?: string
          alert_type?: string
          severity?: string
          title?: string
          description?: string | null
          source_slug?: string | null
          metadata?: Json
          is_read?: boolean
          is_dismissed?: boolean
          created_at?: string
          triggered_at?: string | null
          resolved_at?: string | null
        }
        Relationships: []
      }
      daily_ingestion_metrics: {
        Row: {
          date: string
          total_runs: number
          total_inserted: number
          total_duplicates: number
          total_failed: number
          success_rate: number
          avg_duration_seconds: number
          sources_with_errors: number
          duplicate_rate_percent: number
          created_at: string
        }
        Insert: {
          date: string
          total_runs?: number
          total_inserted?: number
          total_duplicates?: number
          total_failed?: number
          success_rate?: number
          avg_duration_seconds?: number
          sources_with_errors?: number
          duplicate_rate_percent?: number
          created_at?: string
        }
        Update: {
          date?: string
          total_runs?: number
          total_inserted?: number
          total_duplicates?: number
          total_failed?: number
          success_rate?: number
          avg_duration_seconds?: number
          sources_with_errors?: number
          duplicate_rate_percent?: number
          created_at?: string
        }
        Relationships: []
      }
      ingestion_activity_log: {
        Row: {
          id: string
          run_id: string | null
          sources_requested: string[] | null
          trigger_type: string | null
          status: string | null
          total_inserted: number
          total_duplicates: number
          total_failed: number
          started_at: string | null
          finished_at: string | null
          duration_seconds: number | null
          error_message: string | null
          progress_percent: number
          created_at: string
        }
        Insert: {
          id?: string
          run_id?: string | null
          sources_requested?: string[] | null
          trigger_type?: string | null
          status?: string | null
          total_inserted?: number
          total_duplicates?: number
          total_failed?: number
          started_at?: string | null
          finished_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          progress_percent?: number
          created_at?: string
        }
        Update: {
          id?: string
          run_id?: string | null
          sources_requested?: string[] | null
          trigger_type?: string | null
          status?: string | null
          total_inserted?: number
          total_duplicates?: number
          total_failed?: number
          started_at?: string | null
          finished_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          progress_percent?: number
          created_at?: string
        }
        Relationships: []
      }
      source_performance_metrics: {
        Row: {
          source_slug: string
          success_rate_7d: number
          avg_jobs_per_run_7d: number
          total_runs_7d: number
          failed_runs_7d: number
          success_rate_30d: number
          avg_jobs_per_run_30d: number
          total_runs_30d: number
          failed_runs_30d: number
          consecutive_failures: number
          last_error: string | null
          last_error_at: string | null
          is_degraded: boolean
          health_score: number
          health_factors: Json
          updated_at: string
          last_run_at: string | null
        }
        Insert: {
          source_slug: string
          success_rate_7d?: number
          avg_jobs_per_run_7d?: number
          total_runs_7d?: number
          failed_runs_7d?: number
          success_rate_30d?: number
          avg_jobs_per_run_30d?: number
          total_runs_30d?: number
          failed_runs_30d?: number
          consecutive_failures?: number
          last_error?: string | null
          last_error_at?: string | null
          is_degraded?: boolean
          health_score?: number
          health_factors?: Json
          updated_at?: string
          last_run_at?: string | null
        }
        Update: {
          source_slug?: string
          success_rate_7d?: number
          avg_jobs_per_run_7d?: number
          total_runs_7d?: number
          failed_runs_7d?: number
          success_rate_30d?: number
          avg_jobs_per_run_30d?: number
          total_runs_30d?: number
          failed_runs_30d?: number
          consecutive_failures?: number
          last_error?: string | null
          last_error_at?: string | null
          is_degraded?: boolean
          health_score?: number
          health_factors?: Json
          updated_at?: string
          last_run_at?: string | null
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          created_at: string | null
          feature_type: string
          feedback: string | null
          id: string
          input_summary: string | null
          output_summary: string | null
          processing_time_ms: number | null
          tokens_used: number | null
          user_id: string
          user_rating: number | null
        }
        Insert: {
          created_at?: string | null
          feature_type: string
          feedback?: string | null
          id?: string
          input_summary?: string | null
          output_summary?: string | null
          processing_time_ms?: number | null
          tokens_used?: number | null
          user_id: string
          user_rating?: number | null
        }
        Update: {
          created_at?: string | null
          feature_type?: string
          feedback?: string | null
          id?: string
          input_summary?: string | null
          output_summary?: string | null
          processing_time_ms?: number | null
          tokens_used?: number | null
          user_id?: string
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_configs: {
        Row: {
          cost_per_1k_tokens: number
          created_at: string | null
          feature: string
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model_name: string
          priority: number | null
          provider: string
          tier: string
          updated_at: string | null
        }
        Insert: {
          cost_per_1k_tokens: number
          created_at?: string | null
          feature: string
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_name: string
          priority?: number | null
          provider: string
          tier: string
          updated_at?: string | null
        }
        Update: {
          cost_per_1k_tokens?: number
          created_at?: string | null
          feature?: string
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_name?: string
          priority?: number | null
          provider?: string
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          cost_estimate: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          provider: string
          status: string | null
          task_type: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          status?: string | null
          task_type: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          status?: string | null
          task_type?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          cost_usd: number
          created_at: string | null
          id: string
          model: string
          provider: string
          task: string
          tier: string
          tokens_input: number
          tokens_output: number
          user_id: string
        }
        Insert: {
          cost_usd: number
          created_at?: string | null
          id?: string
          model: string
          provider: string
          task: string
          tier: string
          tokens_input: number
          tokens_output: number
          user_id: string
        }
        Update: {
          cost_usd?: number
          created_at?: string | null
          id?: string
          model?: string
          provider?: string
          task?: string
          tier?: string
          tokens_input?: number
          tokens_output?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_tracking: {
        Row: {
          cost: number
          created_at: string | null
          error_message: string | null
          feature: string
          id: string
          job_id: string | null
          model: string | null
          provider: string
          request_id: string | null
          resume_id: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string | null
          error_message?: string | null
          feature: string
          id?: string
          job_id?: string | null
          model?: string | null
          provider: string
          request_id?: string | null
          resume_id?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          error_message?: string | null
          feature?: string
          id?: string
          job_id?: string | null
          model?: string | null
          provider?: string
          request_id?: string | null
          resume_id?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_tracking_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_tracking_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_explanations: {
        Row: {
          analysis_type: string
          created_at: string | null
          criteria: Json
          examples: Json | null
          explanation: string
          id: string
          input_hash: string | null
          model_used: string | null
          reasoning: string | null
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string | null
          criteria: Json
          examples?: Json | null
          explanation: string
          id?: string
          input_hash?: string | null
          model_used?: string | null
          reasoning?: string | null
          score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string | null
          criteria?: Json
          examples?: Json | null
          explanation?: string
          id?: string
          input_hash?: string | null
          model_used?: string | null
          reasoning?: string | null
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_name: string
          id: string
          properties: Json | null
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      application_events: {
        Row: {
          application_id: string
          created_at: string | null
          description: string | null
          event_date: string | null
          event_type: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_type: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_suggestions: Json | null
          applied_date: string
          ats_optimization_applied: boolean | null
          company: string
          cover_letter: string | null
          cover_letter_draft: string | null
          cover_letter_final: string | null
          created_at: string | null
          estimated_probability: number | null
          follow_up_date: string | null
          id: string
          interview_date: string | null
          job_id: string | null
          location: string | null
          notes: string | null
          offer_date: string | null
          position: string
          qa_answers: Json | null
          ranking_explanation: string | null
          recruiter_email: string | null
          recruiter_name: string | null
          recruiter_phone: string | null
          response_deadline: string | null
          resume_id: string | null
          salary_expectation: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_suggestions?: Json | null
          applied_date?: string
          ats_optimization_applied?: boolean | null
          company: string
          cover_letter?: string | null
          cover_letter_draft?: string | null
          cover_letter_final?: string | null
          created_at?: string | null
          estimated_probability?: number | null
          follow_up_date?: string | null
          id?: string
          interview_date?: string | null
          job_id?: string | null
          location?: string | null
          notes?: string | null
          offer_date?: string | null
          position: string
          qa_answers?: Json | null
          ranking_explanation?: string | null
          recruiter_email?: string | null
          recruiter_name?: string | null
          recruiter_phone?: string | null
          response_deadline?: string | null
          resume_id?: string | null
          salary_expectation?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_suggestions?: Json | null
          applied_date?: string
          ats_optimization_applied?: boolean | null
          company?: string
          cover_letter?: string | null
          cover_letter_draft?: string | null
          cover_letter_final?: string | null
          created_at?: string | null
          estimated_probability?: number | null
          follow_up_date?: string | null
          id?: string
          interview_date?: string | null
          job_id?: string | null
          location?: string | null
          notes?: string | null
          offer_date?: string | null
          position?: string
          qa_answers?: Json | null
          ranking_explanation?: string | null
          recruiter_email?: string | null
          recruiter_name?: string | null
          recruiter_phone?: string | null
          response_deadline?: string | null
          resume_id?: string | null
          salary_expectation?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_apply_settings: {
        Row: {
          apply_only_canonical: boolean
          created_at: string
          enabled: boolean
          max_per_week: number
          min_match_score: number
          min_salary: number | null
          mode: string
          require_values_alignment: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          apply_only_canonical?: boolean
          created_at?: string
          enabled?: boolean
          max_per_week?: number
          min_match_score?: number
          min_salary?: number | null
          mode?: string
          require_values_alignment?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          apply_only_canonical?: boolean
          created_at?: string
          enabled?: boolean
          max_per_week?: number
          min_match_score?: number
          min_salary?: number | null
          mode?: string
          require_values_alignment?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bullet_bank: {
        Row: {
          category: string | null
          company: string | null
          content: string
          created_at: string | null
          enhanced_by_ai: boolean | null
          id: string
          job_title: string | null
          last_used: string | null
          original_content: string | null
          tags: Json | null
          times_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          company?: string | null
          content: string
          created_at?: string | null
          enhanced_by_ai?: boolean | null
          id?: string
          job_title?: string | null
          last_used?: string | null
          original_content?: string | null
          tags?: Json | null
          times_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          company?: string | null
          content?: string
          created_at?: string | null
          enhanced_by_ai?: boolean | null
          id?: string
          job_title?: string | null
          last_used?: string | null
          original_content?: string | null
          tags?: Json | null
          times_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bullet_bank_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          last_contacted: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          relationship: string | null
          tags: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contacted?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          relationship?: string | null
          tags?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contacted?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          relationship?: string | null
          tags?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_letters: {
        Row: {
          ai_generated: boolean | null
          application_id: string | null
          content: string
          created_at: string | null
          id: string
          job_id: string | null
          template_used: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          application_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          template_used?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          application_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          template_used?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_prep: {
        Row: {
          ai_feedback: Json | null
          application_id: string | null
          company: string | null
          created_at: string | null
          id: string
          interview_date: string | null
          interview_type: string | null
          position: string | null
          practice_sessions: Json | null
          questions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_feedback?: Json | null
          application_id?: string | null
          company?: string | null
          created_at?: string | null
          id?: string
          interview_date?: string | null
          interview_type?: string | null
          position?: string | null
          practice_sessions?: Json | null
          questions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_feedback?: Json | null
          application_id?: string | null
          company?: string | null
          created_at?: string | null
          id?: string
          interview_date?: string | null
          interview_type?: string | null
          position?: string | null
          practice_sessions?: Json | null
          questions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_prep_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_prep_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          job_id: string | null
          question: string
          score: number | null
          user_answer: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          job_id?: string | null
          question: string
          score?: number | null
          user_answer?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          job_id?: string | null
          question?: string
          score?: number | null
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string | null
          created_at: string
          details: Json | null
          id: string
          job_id: string
          match_score: number | null
          mode: string | null
          source: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          job_id: string
          match_score?: number | null
          mode?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          job_id?: string
          match_score?: number | null
          mode?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matches: {
        Row: {
          created_at: string
          id: string
          job_id: string
          match_score: number
          user_id: string
          values_alignment: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          match_score: number
          user_id: string
          values_alignment?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number
          user_id?: string
          values_alignment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_preferences: {
        Row: {
          allowed_timezones: string[] | null
          auto_apply_max_apps_per_day: number | null
          auto_apply_min_match_score: number | null
          created_at: string | null
          enable_auto_apply: boolean | null
          exclude_companies: string[] | null
          exclude_contract_types: string[] | null
          exclude_titles: string[] | null
          id: string
          min_salary: number | null
          preferred_locations: string[] | null
          primary_title: string | null
          related_titles: string[] | null
          remote_preference: string | null
          salary_currency: string | null
          salary_unit: string | null
          seniority_levels: string[] | null
          target_functions: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allowed_timezones?: string[] | null
          auto_apply_max_apps_per_day?: number | null
          auto_apply_min_match_score?: number | null
          created_at?: string | null
          enable_auto_apply?: boolean | null
          exclude_companies?: string[] | null
          exclude_contract_types?: string[] | null
          exclude_titles?: string[] | null
          id?: string
          min_salary?: number | null
          preferred_locations?: string[] | null
          primary_title?: string | null
          related_titles?: string[] | null
          remote_preference?: string | null
          salary_currency?: string | null
          salary_unit?: string | null
          seniority_levels?: string[] | null
          target_functions?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allowed_timezones?: string[] | null
          auto_apply_max_apps_per_day?: number | null
          auto_apply_min_match_score?: number | null
          created_at?: string | null
          enable_auto_apply?: boolean | null
          exclude_companies?: string[] | null
          exclude_contract_types?: string[] | null
          exclude_titles?: string[] | null
          id?: string
          min_salary?: number | null
          preferred_locations?: string[] | null
          primary_title?: string | null
          related_titles?: string[] | null
          remote_preference?: string | null
          salary_currency?: string | null
          salary_unit?: string | null
          seniority_levels?: string[] | null
          target_functions?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      job_sources: {
        Row: {
          api_key_required: boolean | null
          auth_mode: string | null
          created_at: string | null
          enabled: boolean | null
          endpoint_url: string | null
          id: string
          last_error: string | null
          last_fetch: string | null
          last_sync: string | null
          metadata: Json | null
          mode: string | null
          name: string
          public_key: string | null
          rate_limit_per_minute: number | null
          secret_key: string | null
          source_key: string
          update_frequency: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          api_key_required?: boolean | null
          auth_mode?: string | null
          created_at?: string | null
          enabled?: boolean | null
          endpoint_url?: string | null
          id?: string
          last_error?: string | null
          last_fetch?: string | null
          last_sync?: string | null
          metadata?: Json | null
          mode?: string | null
          name: string
          public_key?: string | null
          rate_limit_per_minute?: number | null
          secret_key?: string | null
          source_key: string
          update_frequency?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          api_key_required?: boolean | null
          auth_mode?: string | null
          created_at?: string | null
          enabled?: boolean | null
          endpoint_url?: string | null
          id?: string
          last_error?: string | null
          last_fetch?: string | null
          last_sync?: string | null
          metadata?: Json | null
          mode?: string | null
          name?: string
          public_key?: string | null
          rate_limit_per_minute?: number | null
          secret_key?: string | null
          source_key?: string
          update_frequency?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      job_sources_performance: {
        Row: {
          avg_match_score: number | null
          created_at: string | null
          id: string
          last_sync: string | null
          source_name: string
          total_jobs_indexed: number | null
          total_matches_generated: number | null
          updated_at: string | null
          user_satisfaction_score: number | null
        }
        Insert: {
          avg_match_score?: number | null
          created_at?: string | null
          id?: string
          last_sync?: string | null
          source_name: string
          total_jobs_indexed?: number | null
          total_matches_generated?: number | null
          updated_at?: string | null
          user_satisfaction_score?: number | null
        }
        Update: {
          avg_match_score?: number | null
          created_at?: string | null
          id?: string
          last_sync?: string | null
          source_name?: string
          total_jobs_indexed?: number | null
          total_matches_generated?: number | null
          updated_at?: string | null
          user_satisfaction_score?: number | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          benefits: Json | null
          company: string | null
          company_logo_url: string | null
          competitiveness_level: string | null
          created_at: string | null
          dedup_key: string | null
          description: string | null
          employment_type: string | null
          external_id: string | null
          external_job_id: string | null
          external_source: string | null
          external_url: string | null
          extracted_structure: Json | null
          id: string
          is_active: boolean | null
          is_official: boolean | null
          job_type: string | null
          location: string | null
          match_reasons: Json | null
          match_score: number | null
          original_posting_url: string | null
          posted_date: string | null
          probability_estimate: number | null
          ranking_score: number | null
          raw: Json | null
          raw_payload: Json | null
          remote_type: string | null
          requirements: Json | null
          responsibilities: Json | null
          salary_max: number | null
          salary_min: number | null
          salary_range: string | null
          saved_date: string | null
          source: string | null
          source_id: string | null
          source_slug: string | null
          source_url: string | null
          status: string | null
          title: string
          updated_at: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          benefits?: Json | null
          company?: string | null
          company_logo_url?: string | null
          competitiveness_level?: string | null
          created_at?: string | null
          dedup_key?: string | null
          description?: string | null
          employment_type?: string | null
          external_id?: string | null
          external_job_id?: string | null
          external_source?: string | null
          external_url?: string | null
          extracted_structure?: Json | null
          id?: string
          is_active?: boolean | null
          is_official?: boolean | null
          job_type?: string | null
          location?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          original_posting_url?: string | null
          posted_date?: string | null
          probability_estimate?: number | null
          ranking_score?: number | null
          raw?: Json | null
          raw_payload?: Json | null
          remote_type?: string | null
          requirements?: Json | null
          responsibilities?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          salary_range?: string | null
          saved_date?: string | null
          source?: string | null
          source_id?: string | null
          source_slug?: string | null
          source_url?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          benefits?: Json | null
          company?: string | null
          company_logo_url?: string | null
          competitiveness_level?: string | null
          created_at?: string | null
          dedup_key?: string | null
          description?: string | null
          employment_type?: string | null
          external_id?: string | null
          external_job_id?: string | null
          external_source?: string | null
          external_url?: string | null
          extracted_structure?: Json | null
          id?: string
          is_active?: boolean | null
          is_official?: boolean | null
          job_type?: string | null
          location?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          original_posting_url?: string | null
          posted_date?: string | null
          probability_estimate?: number | null
          ranking_score?: number | null
          raw?: Json | null
          raw_payload?: Json | null
          remote_type?: string | null
          requirements?: Json | null
          responsibilities?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          salary_range?: string | null
          saved_date?: string | null
          source?: string | null
          source_id?: string | null
          source_slug?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "job_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_course_skills: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          relevance: number | null
          skill_slug: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          relevance?: number | null
          skill_slug: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          relevance?: number | null
          skill_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_courses: {
        Row: {
          created_at: string | null
          estimated_hours: number | null
          id: string
          is_free: boolean | null
          language: string | null
          last_fetched_at: string | null
          level: string | null
          price: string | null
          provider_course_id: string
          provider_id: string
          rating: number | null
          ratings_count: number | null
          short_description: string | null
          skill_key: string | null
          skill_tags: string[] | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_hours?: number | null
          id?: string
          is_free?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          level?: string | null
          price?: string | null
          provider_course_id: string
          provider_id: string
          rating?: number | null
          ratings_count?: number | null
          short_description?: string | null
          skill_key?: string | null
          skill_tags?: string[] | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_hours?: number | null
          id?: string
          is_free?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          level?: string | null
          price?: string | null
          provider_course_id?: string
          provider_id?: string
          rating?: number | null
          ratings_count?: number | null
          short_description?: string | null
          skill_key?: string | null
          skill_tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_courses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "learning_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_steps: {
        Row: {
          id: string
          label: string
          notes: string | null
          path_id: string
          resource_url: string | null
          step_order: number
          step_type: string
        }
        Insert: {
          id?: string
          label: string
          notes?: string | null
          path_id: string
          resource_url?: string | null
          step_order: number
          step_type: string
        }
        Update: {
          id?: string
          label?: string
          notes?: string | null
          path_id?: string
          resource_url?: string | null
          step_order?: number
          step_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_steps_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string | null
          difficulty: string | null
          estimated_minutes: number | null
          id: string
          is_active: boolean | null
          short_description: string | null
          skill_slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          short_description?: string | null
          skill_slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          short_description?: string | null
          skill_slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_skill_slug_fkey"
            columns: ["skill_slug"]
            isOneToOne: false
            referencedRelation: "skills_library"
            referencedColumns: ["slug"]
          },
        ]
      }
      learning_providers: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          slug?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      learning_search_cache: {
        Row: {
          created_at: string | null
          id: string
          provider_slug: string
          response: Json
          skill_slug: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider_slug: string
          response: Json
          skill_slug: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          provider_slug?: string
          response?: Json
          skill_slug?: string
          user_id?: string | null
        }
        Relationships: []
      }
      learning_sources: {
        Row: {
          active: boolean | null
          api_key: string | null
          api_url: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          api_key?: string | null
          api_url?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          api_key?: string | null
          api_url?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      preferences: {
        Row: {
          created_at: string | null
          deal_breakers: Json | null
          email_notifications: boolean | null
          id: string
          max_salary: number | null
          min_salary: number | null
          nice_to_have_skills: Json | null
          notification_frequency: string | null
          preferred_companies: Json | null
          preferred_job_titles: Json | null
          preferred_job_types: Json | null
          preferred_locations: Json | null
          remote_preference: string | null
          required_skills: Json | null
          updated_at: string | null
          user_id: string
          willing_to_relocate: boolean | null
        }
        Insert: {
          created_at?: string | null
          deal_breakers?: Json | null
          email_notifications?: boolean | null
          id?: string
          max_salary?: number | null
          min_salary?: number | null
          nice_to_have_skills?: Json | null
          notification_frequency?: string | null
          preferred_companies?: Json | null
          preferred_job_titles?: Json | null
          preferred_job_types?: Json | null
          preferred_locations?: Json | null
          remote_preference?: string | null
          required_skills?: Json | null
          updated_at?: string | null
          user_id: string
          willing_to_relocate?: boolean | null
        }
        Update: {
          created_at?: string | null
          deal_breakers?: Json | null
          email_notifications?: boolean | null
          id?: string
          max_salary?: number | null
          min_salary?: number | null
          nice_to_have_skills?: Json | null
          notification_frequency?: string | null
          preferred_companies?: Json | null
          preferred_job_titles?: Json | null
          preferred_job_types?: Json | null
          preferred_locations?: Json | null
          remote_preference?: string | null
          required_skills?: Json | null
          updated_at?: string | null
          user_id?: string
          willing_to_relocate?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_level: string | null
          auto_apply_active: boolean
          avatar_url: string | null
          created_at: string | null
          current_role_title: string | null
          email: string
          enable_experimental_features: boolean | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          layout_density: string | null
          location: string | null
          notif_application_updates: boolean | null
          notif_high_match: boolean | null
          notif_weekly_digest: boolean | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          plan_tier: string | null
          preferred_name: string | null
          theme_preference: string | null
          tier: string | null
          timezone: string | null
          updated_at: string | null
          use_data_for_recommendations: boolean | null
          voice_conciseness: number | null
          voice_custom_sample: string | null
          voice_formality: number | null
          voice_playfulness: number | null
          voice_preset: string | null
        }
        Insert: {
          admin_level?: string | null
          auto_apply_active?: boolean
          avatar_url?: string | null
          created_at?: string | null
          current_role_title?: string | null
          email: string
          enable_experimental_features?: boolean | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          layout_density?: string | null
          location?: string | null
          notif_application_updates?: boolean | null
          notif_high_match?: boolean | null
          notif_weekly_digest?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          plan_tier?: string | null
          preferred_name?: string | null
          theme_preference?: string | null
          tier?: string | null
          timezone?: string | null
          updated_at?: string | null
          use_data_for_recommendations?: boolean | null
          voice_conciseness?: number | null
          voice_custom_sample?: string | null
          voice_formality?: number | null
          voice_playfulness?: number | null
          voice_preset?: string | null
        }
        Update: {
          admin_level?: string | null
          auto_apply_active?: boolean
          avatar_url?: string | null
          created_at?: string | null
          current_role_title?: string | null
          email?: string
          enable_experimental_features?: boolean | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          layout_density?: string | null
          location?: string | null
          notif_application_updates?: boolean | null
          notif_high_match?: boolean | null
          notif_weekly_digest?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          plan_tier?: string | null
          preferred_name?: string | null
          theme_preference?: string | null
          tier?: string | null
          timezone?: string | null
          updated_at?: string | null
          use_data_for_recommendations?: boolean | null
          voice_conciseness?: number | null
          voice_custom_sample?: string | null
          voice_formality?: number | null
          voice_playfulness?: number | null
          voice_preset?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          ats_score: number | null
          ats_suggestions: Json | null
          certifications: Json | null
          created_at: string | null
          education: Json | null
          id: string
          is_default: boolean | null
          keywords: Json | null
          languages: Json | null
          last_optimization_date: string | null
          optimization_history: Json | null
          personal_info: Json | null
          projects: Json | null
          skills: Json | null
          summary: string | null
          title: string
          updated_at: string | null
          user_id: string
          version_number: number | null
          work_experience: Json | null
        }
        Insert: {
          ats_score?: number | null
          ats_suggestions?: Json | null
          certifications?: Json | null
          created_at?: string | null
          education?: Json | null
          id?: string
          is_default?: boolean | null
          keywords?: Json | null
          languages?: Json | null
          last_optimization_date?: string | null
          optimization_history?: Json | null
          personal_info?: Json | null
          projects?: Json | null
          skills?: Json | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          user_id: string
          version_number?: number | null
          work_experience?: Json | null
        }
        Update: {
          ats_score?: number | null
          ats_suggestions?: Json | null
          certifications?: Json | null
          created_at?: string | null
          education?: Json | null
          id?: string
          is_default?: boolean | null
          keywords?: Json | null
          languages?: Json | null
          last_optimization_date?: string | null
          optimization_history?: Json | null
          personal_info?: Json | null
          projects?: Json | null
          skills?: Json | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          version_number?: number | null
          work_experience?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          id: string
          job_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          job_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          job_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_gap_analyses: {
        Row: {
          created_at: string | null
          gaps: Json
          id: string
          job_id: string | null
          learning_plan: Json
          skill_key: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gaps: Json
          id?: string
          job_id?: string | null
          learning_plan: Json
          skill_key?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          gaps?: Json
          id?: string
          job_id?: string | null
          learning_plan?: Json
          skill_key?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_gap_analyses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_library: {
        Row: {
          category: string | null
          certifications: Json | null
          created_at: string | null
          display_name: string | null
          examples: Json | null
          id: string
          last_used: string | null
          proficiency_level: string | null
          skill_name: string
          slug: string
          updated_at: string | null
          used_in_resumes: number | null
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          category?: string | null
          certifications?: Json | null
          created_at?: string | null
          display_name?: string | null
          examples?: Json | null
          id?: string
          last_used?: string | null
          proficiency_level?: string | null
          skill_name: string
          slug: string
          updated_at?: string | null
          used_in_resumes?: number | null
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          category?: string | null
          certifications?: Json | null
          created_at?: string | null
          display_name?: string | null
          examples?: Json | null
          id?: string
          last_used?: string | null
          proficiency_level?: string | null
          skill_name?: string
          slug?: string
          updated_at?: string | null
          used_in_resumes?: number | null
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_preferences: {
        Row: {
          avoid_skills: Json | null
          created_at: string | null
          focus_skills: Json | null
          id: string
          learning_style: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avoid_skills?: Json | null
          created_at?: string | null
          focus_skills?: Json | null
          id?: string
          learning_style?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avoid_skills?: Json | null
          created_at?: string | null
          focus_skills?: Json | null
          id?: string
          learning_style?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      feature_usage_stats: {
        Row: {
          avg_tokens: number | null
          feature: string | null
          total_cost: number | null
          total_uses: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      provider_usage_stats: {
        Row: {
          avg_tokens: number | null
          provider: string | null
          total_calls: number | null
          total_cost: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      user_monthly_usage: {
        Row: {
          avg_tokens: number | null
          feature: string | null
          month: string | null
          total_cost: number | null
          total_uses: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_conversion_funnel: {
        Row: {
          avg_days_to_upgrade: number | null
          conversion_rate_percent: number | null
          signup_date: string | null
          signups: number | null
          upgraded_to_pro: number | null
        }
        Relationships: []
      }
      v_daily_active_users: {
        Row: {
          active_users: number | null
          date: string | null
          users_analyzing: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_usage_limit: {
        Args: { p_feature: string; p_tier: string; p_user_id: string }
        Returns: {
          allowed: boolean
          limit_amount: number
          used: number
        }[]
      }
      get_tier_distribution: {
        Args: never
        Returns: {
          count: number
          percentage: number
          tier: string
        }[]
      }
      get_user_conversion_status: {
        Args: { user_uuid: string }
        Returns: {
          analyses_run: number
          conversion_date: string
          converted: boolean
          current_tier: string
          days_active: number
          user_id: string
        }[]
      }
      record_ai_usage: {
        Args: {
          p_cost: number
          p_feature: string
          p_job_id?: string
          p_model: string
          p_provider: string
          p_resume_id?: string
          p_tokens_used: number
          p_user_id: string
        }
        Returns: {
          cost: number
          created_at: string | null
          error_message: string | null
          feature: string
          id: string
          job_id: string | null
          model: string | null
          provider: string
          request_id: string | null
          resume_id: string | null
          tokens_used: number | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ai_usage_tracking"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
