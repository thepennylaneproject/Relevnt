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
      admin_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          metadata: Json | null
          resolved_at: string | null
          severity: string
          source_slug: string | null
          title: string
          triggered_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          severity: string
          source_slug?: string | null
          title: string
          triggered_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          source_slug?: string | null
          title?: string
          triggered_at?: string | null
        }
        Relationships: []
      }
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
      ai_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          payload: Json
          quality: string
          task_name: string
          user_tier: string
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          payload: Json
          quality: string
          task_name: string
          user_tier: string
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          payload?: Json
          quality?: string
          task_name?: string
          user_tier?: string
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
      ai_invocations: {
        Row: {
          cache_hit: boolean | null
          cost_estimate: number | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: number
          input_size: number | null
          latency_ms: number | null
          model: string
          output_size: number | null
          provider: string
          quality: string
          reason: string | null
          success: boolean | null
          task_name: string
          tier: string
          trace_id: string | null
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean | null
          cost_estimate?: number | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: number
          input_size?: number | null
          latency_ms?: number | null
          model: string
          output_size?: number | null
          provider: string
          quality: string
          reason?: string | null
          success?: boolean | null
          task_name: string
          tier: string
          trace_id?: string | null
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean | null
          cost_estimate?: number | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: number
          input_size?: number | null
          latency_ms?: number | null
          model?: string
          output_size?: number | null
          provider?: string
          quality?: string
          reason?: string | null
          success?: boolean | null
          task_name?: string
          tier?: string
          trace_id?: string | null
          user_id?: string | null
        }
        Relationships: []
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
            foreignKeyName: "ai_usage_tracking_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
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
      analytics_daily_summaries: {
        Row: {
          created_at: string
          day: string
          id: string
          meta: Json | null
          metric_key: string
          metric_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          meta?: Json | null
          metric_key: string
          metric_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          meta?: Json | null
          metric_key?: string
          metric_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          event_time: string
          id: string
          page_path: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          event_time?: string
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_time?: string
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
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
          application_source: string | null
          applied_date: string
          ats_optimization_applied: boolean | null
          attempt_count: number | null
          company: string
          company_response_time: number | null
          cover_letter: string | null
          cover_letter_draft: string | null
          cover_letter_final: string | null
          created_at: string | null
          estimated_probability: number | null
          follow_up_date: string | null
          id: string
          interview_date: string | null
          job_company_size: string | null
          job_experience_level: string | null
          job_id: string | null
          job_industry: string | null
          job_skills_required: Json | null
          last_attempt_at: string | null
          last_error: string | null
          last_status_update: string | null
          location: string | null
          metadata: Json | null
          negotiation_notes: string | null
          negotiation_strategy: string | null
          notes: string | null
          offer_date: string | null
          offer_details: Json | null
          persona_id: string | null
          position: string
          qa_answers: Json | null
          ranking_explanation: string | null
          recruiter_email: string | null
          recruiter_name: string | null
          recruiter_phone: string | null
          rejection_analysis: Json | null
          response_deadline: string | null
          response_received: boolean | null
          resume_id: string | null
          resume_snapshot: Json | null
          rule_id: string | null
          salary_expectation: string | null
          status: string | null
          submission_method: string | null
          target_salary_max: number | null
          target_salary_min: number | null
          trace_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_suggestions?: Json | null
          application_source?: string | null
          applied_date?: string
          ats_optimization_applied?: boolean | null
          attempt_count?: number | null
          company: string
          company_response_time?: number | null
          cover_letter?: string | null
          cover_letter_draft?: string | null
          cover_letter_final?: string | null
          created_at?: string | null
          estimated_probability?: number | null
          follow_up_date?: string | null
          id?: string
          interview_date?: string | null
          job_company_size?: string | null
          job_experience_level?: string | null
          job_id?: string | null
          job_industry?: string | null
          job_skills_required?: Json | null
          last_attempt_at?: string | null
          last_error?: string | null
          last_status_update?: string | null
          location?: string | null
          metadata?: Json | null
          negotiation_notes?: string | null
          negotiation_strategy?: string | null
          notes?: string | null
          offer_date?: string | null
          offer_details?: Json | null
          persona_id?: string | null
          position: string
          qa_answers?: Json | null
          ranking_explanation?: string | null
          recruiter_email?: string | null
          recruiter_name?: string | null
          recruiter_phone?: string | null
          rejection_analysis?: Json | null
          response_deadline?: string | null
          response_received?: boolean | null
          resume_id?: string | null
          resume_snapshot?: Json | null
          rule_id?: string | null
          salary_expectation?: string | null
          status?: string | null
          submission_method?: string | null
          target_salary_max?: number | null
          target_salary_min?: number | null
          trace_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_suggestions?: Json | null
          application_source?: string | null
          applied_date?: string
          ats_optimization_applied?: boolean | null
          attempt_count?: number | null
          company?: string
          company_response_time?: number | null
          cover_letter?: string | null
          cover_letter_draft?: string | null
          cover_letter_final?: string | null
          created_at?: string | null
          estimated_probability?: number | null
          follow_up_date?: string | null
          id?: string
          interview_date?: string | null
          job_company_size?: string | null
          job_experience_level?: string | null
          job_id?: string | null
          job_industry?: string | null
          job_skills_required?: Json | null
          last_attempt_at?: string | null
          last_error?: string | null
          last_status_update?: string | null
          location?: string | null
          metadata?: Json | null
          negotiation_notes?: string | null
          negotiation_strategy?: string | null
          notes?: string | null
          offer_date?: string | null
          offer_details?: Json | null
          persona_id?: string | null
          position?: string
          qa_answers?: Json | null
          ranking_explanation?: string | null
          recruiter_email?: string | null
          recruiter_name?: string | null
          recruiter_phone?: string | null
          rejection_analysis?: Json | null
          response_deadline?: string | null
          response_received?: boolean | null
          resume_id?: string | null
          resume_snapshot?: Json | null
          rule_id?: string | null
          salary_expectation?: string | null
          status?: string | null
          submission_method?: string | null
          target_salary_max?: number | null
          target_salary_min?: number | null
          trace_id?: string | null
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
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
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
            foreignKeyName: "applications_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "auto_apply_rules"
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
      auto_apply_logs: {
        Row: {
          artifacts: Json | null
          attempt_count: number | null
          created_at: string | null
          error_message: string | null
          id: string
          job_id: string | null
          persona_id: string | null
          rule_id: string | null
          status: string | null
          submission_url: string | null
          trace_id: string | null
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          artifacts?: Json | null
          attempt_count?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_id?: string | null
          persona_id?: string | null
          rule_id?: string | null
          status?: string | null
          submission_url?: string | null
          trace_id?: string | null
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          artifacts?: Json | null
          attempt_count?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_id?: string | null
          persona_id?: string | null
          rule_id?: string | null
          status?: string | null
          submission_url?: string | null
          trace_id?: string | null
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_apply_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_apply_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_apply_logs_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_apply_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "auto_apply_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_apply_rules: {
        Row: {
          active_days: string[] | null
          created_at: string | null
          enabled: boolean | null
          exclude_companies: string[] | null
          failed_applications: number | null
          id: string
          include_only_companies: string[] | null
          last_run_at: string | null
          match_score_threshold: number | null
          max_applications_per_week: number | null
          name: string
          persona_id: string | null
          require_all_keywords: string[] | null
          successful_applications: number | null
          total_applications: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_days?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          exclude_companies?: string[] | null
          failed_applications?: number | null
          id?: string
          include_only_companies?: string[] | null
          last_run_at?: string | null
          match_score_threshold?: number | null
          max_applications_per_week?: number | null
          name: string
          persona_id?: string | null
          require_all_keywords?: string[] | null
          successful_applications?: number | null
          total_applications?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_days?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          exclude_companies?: string[] | null
          failed_applications?: number | null
          id?: string
          include_only_companies?: string[] | null
          last_run_at?: string | null
          match_score_threshold?: number | null
          max_applications_per_week?: number | null
          name?: string
          persona_id?: string | null
          require_all_keywords?: string[] | null
          successful_applications?: number | null
          total_applications?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_apply_rules_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
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
      career_narratives: {
        Row: {
          created_at: string | null
          future_vision: string | null
          id: string
          origin_story: string | null
          pivot_explanation: string | null
          updated_at: string | null
          user_id: string
          value_proposition: string | null
          voice_settings: Json | null
        }
        Insert: {
          created_at?: string | null
          future_vision?: string | null
          id?: string
          origin_story?: string | null
          pivot_explanation?: string | null
          updated_at?: string | null
          user_id: string
          value_proposition?: string | null
          voice_settings?: Json | null
        }
        Update: {
          created_at?: string | null
          future_vision?: string | null
          id?: string
          origin_story?: string | null
          pivot_explanation?: string | null
          updated_at?: string | null
          user_id?: string
          value_proposition?: string | null
          voice_settings?: Json | null
        }
        Relationships: []
      }
      career_profiles: {
        Row: {
          created_at: string | null
          id: string
          profile: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      career_tracks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          min_salary: number | null
          name: string
          preferred_locations: string[] | null
          primary_resume_id: string | null
          target_titles: string[] | null
          updated_at: string
          user_id: string
          work_mode: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          min_salary?: number | null
          name: string
          preferred_locations?: string[] | null
          primary_resume_id?: string | null
          target_titles?: string[] | null
          updated_at?: string
          user_id: string
          work_mode?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          min_salary?: number | null
          name?: string
          preferred_locations?: string[] | null
          primary_resume_id?: string | null
          target_titles?: string[] | null
          updated_at?: string
          user_id?: string
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_tracks_primary_resume_id_fkey"
            columns: ["primary_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_tracks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_client_relationships: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string | null
          discovered_at: string | null
          discovered_via: string | null
          domain: string | null
          employee_count: number | null
          founding_year: number | null
          funding_stage: string | null
          greenhouse_board_token: string | null
          growth_score: number | null
          id: string
          industry: string | null
          is_active: boolean | null
          job_creation_velocity: number | null
          last_synced_at: string | null
          last_synced_platforms: string[] | null
          lever_slug: string | null
          name: string
          priority_tier: string | null
          sync_frequency_hours: number | null
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          discovered_at?: string | null
          discovered_via?: string | null
          domain?: string | null
          employee_count?: number | null
          founding_year?: number | null
          funding_stage?: string | null
          greenhouse_board_token?: string | null
          growth_score?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          job_creation_velocity?: number | null
          last_synced_at?: string | null
          last_synced_platforms?: string[] | null
          lever_slug?: string | null
          name: string
          priority_tier?: string | null
          sync_frequency_hours?: number | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          discovered_at?: string | null
          discovered_via?: string | null
          domain?: string | null
          employee_count?: number | null
          founding_year?: number | null
          funding_stage?: string | null
          greenhouse_board_token?: string | null
          growth_score?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          job_creation_velocity?: number | null
          last_synced_at?: string | null
          last_synced_platforms?: string[] | null
          lever_slug?: string | null
          name?: string
          priority_tier?: string | null
          sync_frequency_hours?: number | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: []
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
            foreignKeyName: "cover_letters_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
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
      daily_ingestion_metrics: {
        Row: {
          avg_duration_seconds: number | null
          created_at: string | null
          date: string
          duplicate_rate_percent: number | null
          sources_with_errors: number | null
          success_rate: number | null
          total_duplicates: number | null
          total_failed: number | null
          total_inserted: number | null
          total_runs: number | null
        }
        Insert: {
          avg_duration_seconds?: number | null
          created_at?: string | null
          date: string
          duplicate_rate_percent?: number | null
          sources_with_errors?: number | null
          success_rate?: number | null
          total_duplicates?: number | null
          total_failed?: number | null
          total_inserted?: number | null
          total_runs?: number | null
        }
        Update: {
          avg_duration_seconds?: number | null
          created_at?: string | null
          date?: string
          duplicate_rate_percent?: number | null
          sources_with_errors?: number | null
          success_rate?: number | null
          total_duplicates?: number | null
          total_failed?: number | null
          total_inserted?: number | null
          total_runs?: number | null
        }
        Relationships: []
      }
      discovery_runs: {
        Row: {
          completed_at: string
          created_at: string | null
          duration_ms: number | null
          errors: string[] | null
          id: string
          run_id: string
          sources: string[] | null
          started_at: string
          stats: Json | null
          status: string | null
        }
        Insert: {
          completed_at: string
          created_at?: string | null
          duration_ms?: number | null
          errors?: string[] | null
          id?: string
          run_id: string
          sources?: string[] | null
          started_at: string
          stats?: Json | null
          status?: string | null
        }
        Update: {
          completed_at?: string
          created_at?: string | null
          duration_ms?: number | null
          errors?: string[] | null
          id?: string
          run_id?: string
          sources?: string[] | null
          started_at?: string
          stats?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      feedback_signals: {
        Row: {
          company_size: string | null
          created_at: string
          feedback_type: string
          id: string
          industry: string | null
          job_id: string
          location: string | null
          persona_id: string
          remote_type: string | null
          user_id: string
        }
        Insert: {
          company_size?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          industry?: string | null
          job_id: string
          location?: string | null
          persona_id: string
          remote_type?: string | null
          user_id: string
        }
        Update: {
          company_size?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          industry?: string | null
          job_id?: string
          location?: string | null
          persona_id?: string
          remote_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_signals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_signals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_signals_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_activity_log: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          progress_percent: number | null
          run_id: string | null
          sources_requested: string[] | null
          started_at: string | null
          status: string | null
          total_duplicates: number | null
          total_failed: number | null
          total_inserted: number | null
          trigger_type: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          progress_percent?: number | null
          run_id?: string | null
          sources_requested?: string[] | null
          started_at?: string | null
          status?: string | null
          total_duplicates?: number | null
          total_failed?: number | null
          total_inserted?: number | null
          trigger_type?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          progress_percent?: number | null
          run_id?: string | null
          sources_requested?: string[] | null
          started_at?: string | null
          status?: string | null
          total_duplicates?: number | null
          total_failed?: number | null
          total_inserted?: number | null
          trigger_type?: string | null
        }
        Relationships: []
      }
      ingestion_healing_log: {
        Row: {
          attempted_at: string | null
          created_at: string | null
          failure_type: string
          healing_action: string
          healing_result: string
          id: string
          meta: Json | null
          original_error: string | null
          resolved_at: string | null
          run_id: string | null
          source: string
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string | null
          failure_type: string
          healing_action: string
          healing_result: string
          id?: string
          meta?: Json | null
          original_error?: string | null
          resolved_at?: string | null
          run_id?: string | null
          source: string
        }
        Update: {
          attempted_at?: string | null
          created_at?: string | null
          failure_type?: string
          healing_action?: string
          healing_result?: string
          id?: string
          meta?: Json | null
          original_error?: string | null
          resolved_at?: string | null
          run_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_healing_log_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "job_ingestion_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_practice_sessions: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          interview_prep_id: string | null
          job_id: string | null
          overall_feedback: Json | null
          practice_data: Json
          questions: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          interview_prep_id?: string | null
          job_id?: string | null
          overall_feedback?: Json | null
          practice_data?: Json
          questions?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          interview_prep_id?: string | null
          job_id?: string | null
          overall_feedback?: Json | null
          practice_data?: Json
          questions?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_practice_sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_practice_sessions_interview_prep_id_fkey"
            columns: ["interview_prep_id"]
            isOneToOne: false
            referencedRelation: "interview_prep"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_practice_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_practice_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
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
          {
            foreignKeyName: "interview_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      job_application_artifacts: {
        Row: {
          ai_trace_id: string | null
          artifact_type: string
          content: string
          format: string
          generated_at: string | null
          id: string
          job_id: string
          metadata: Json | null
          persona_id: string | null
          user_id: string
        }
        Insert: {
          ai_trace_id?: string | null
          artifact_type: string
          content: string
          format?: string
          generated_at?: string | null
          id?: string
          job_id: string
          metadata?: Json | null
          persona_id?: string | null
          user_id: string
        }
        Update: {
          ai_trace_id?: string | null
          artifact_type?: string
          content?: string
          format?: string
          generated_at?: string | null
          id?: string
          job_id?: string
          metadata?: Json | null
          persona_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_application_artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_application_artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_application_artifacts_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
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
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      job_cross_references: {
        Row: {
          canonical_job_id: string
          company_name: string | null
          created_at: string | null
          job_ids_by_source: Json | null
          job_title: string | null
          location: string | null
          matched_confidence: number | null
          updated_at: string | null
        }
        Insert: {
          canonical_job_id: string
          company_name?: string | null
          created_at?: string | null
          job_ids_by_source?: Json | null
          job_title?: string | null
          location?: string | null
          matched_confidence?: number | null
          updated_at?: string | null
        }
        Update: {
          canonical_job_id?: string
          company_name?: string | null
          created_at?: string | null
          job_ids_by_source?: Json | null
          job_title?: string | null
          location?: string | null
          matched_confidence?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      job_duplicates: {
        Row: {
          canonical_job_id: string
          confidence: number | null
          created_at: string | null
          duplicate_job_ids: string[] | null
          matched_at: string | null
          sources: string[] | null
        }
        Insert: {
          canonical_job_id: string
          confidence?: number | null
          created_at?: string | null
          duplicate_job_ids?: string[] | null
          matched_at?: string | null
          sources?: string[] | null
        }
        Update: {
          canonical_job_id?: string
          confidence?: number | null
          created_at?: string | null
          duplicate_job_ids?: string[] | null
          matched_at?: string | null
          sources?: string[] | null
        }
        Relationships: []
      }
      job_ingestion_run_sources: {
        Row: {
          created_at: string
          cursor_in: Json | null
          cursor_out: Json | null
          duplicate_count: number
          error_message: string | null
          finished_at: string | null
          freshness_ratio: number | null
          http_status: number | null
          id: string
          inserted_count: number
          noop_count: number | null
          normalized_count: number
          page_end: number
          page_start: number
          run_id: string
          source: string
          stale_filtered_count: number | null
          started_at: string
          status: string
          updated_count: number | null
        }
        Insert: {
          created_at?: string
          cursor_in?: Json | null
          cursor_out?: Json | null
          duplicate_count?: number
          error_message?: string | null
          finished_at?: string | null
          freshness_ratio?: number | null
          http_status?: number | null
          id?: string
          inserted_count?: number
          noop_count?: number | null
          normalized_count?: number
          page_end?: number
          page_start?: number
          run_id: string
          source: string
          stale_filtered_count?: number | null
          started_at?: string
          status?: string
          updated_count?: number | null
        }
        Update: {
          created_at?: string
          cursor_in?: Json | null
          cursor_out?: Json | null
          duplicate_count?: number
          error_message?: string | null
          finished_at?: string | null
          freshness_ratio?: number | null
          http_status?: number | null
          id?: string
          inserted_count?: number
          noop_count?: number | null
          normalized_count?: number
          page_end?: number
          page_start?: number
          run_id?: string
          source?: string
          stale_filtered_count?: number | null
          started_at?: string
          status?: string
          updated_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_ingestion_run_sources_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "job_ingestion_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_ingestion_runs: {
        Row: {
          created_at: string
          error_summary: string | null
          finished_at: string | null
          id: string
          meta: Json | null
          sources_requested: string[]
          started_at: string
          status: string
          total_duplicates: number
          total_failed_sources: number
          total_inserted: number
          total_normalized: number
          triggered_by: string
        }
        Insert: {
          created_at?: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          meta?: Json | null
          sources_requested?: string[]
          started_at?: string
          status?: string
          total_duplicates?: number
          total_failed_sources?: number
          total_inserted?: number
          total_normalized?: number
          triggered_by?: string
        }
        Update: {
          created_at?: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          meta?: Json | null
          sources_requested?: string[]
          started_at?: string
          status?: string
          total_duplicates?: number
          total_failed_sources?: number
          total_inserted?: number
          total_normalized?: number
          triggered_by?: string
        }
        Relationships: []
      }
      job_ingestion_state: {
        Row: {
          cursor: Json | null
          last_run_at: string | null
          source: string
        }
        Insert: {
          cursor?: Json | null
          last_run_at?: string | null
          source: string
        }
        Update: {
          cursor?: Json | null
          last_run_at?: string | null
          source?: string
        }
        Relationships: []
      }
      job_interaction_patterns: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          job_id: string
          match_factors: Json | null
          match_score: number | null
          persona_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          job_id: string
          match_factors?: Json | null
          match_score?: number | null
          persona_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          job_id?: string
          match_factors?: Json | null
          match_score?: number | null
          persona_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_interaction_patterns_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interaction_patterns_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interaction_patterns_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matches: {
        Row: {
          created_at: string
          expires_at: string | null
          explanation: string | null
          id: string
          is_dismissed: boolean | null
          job_id: string
          match_factors: Json | null
          match_score: number
          persona_id: string | null
          user_id: string
          values_alignment: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          explanation?: string | null
          id?: string
          is_dismissed?: boolean | null
          job_id: string
          match_factors?: Json | null
          match_score: number
          persona_id?: string | null
          user_id: string
          values_alignment?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          explanation?: string | null
          id?: string
          is_dismissed?: boolean | null
          job_id?: string
          match_factors?: Json | null
          match_score?: number
          persona_id?: string | null
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
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matches_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
            referencedColumns: ["id"]
          },
        ]
      }
      job_preferences: {
        Row: {
          allowed_timezones: string[] | null
          auto_apply_max_apps_per_day: number | null
          auto_apply_min_match_score: number | null
          avoid_keywords: string[] | null
          created_at: string | null
          enable_auto_apply: boolean | null
          exclude_companies: string[] | null
          exclude_contract_types: string[] | null
          exclude_titles: string[] | null
          id: string
          include_keywords: string[] | null
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
          avoid_keywords?: string[] | null
          created_at?: string | null
          enable_auto_apply?: boolean | null
          exclude_companies?: string[] | null
          exclude_contract_types?: string[] | null
          exclude_titles?: string[] | null
          id?: string
          include_keywords?: string[] | null
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
          avoid_keywords?: string[] | null
          created_at?: string | null
          enable_auto_apply?: boolean | null
          exclude_companies?: string[] | null
          exclude_contract_types?: string[] | null
          exclude_titles?: string[] | null
          id?: string
          include_keywords?: string[] | null
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
      job_source_health: {
        Row: {
          auto_heal_enabled: boolean | null
          consecutive_failures: number
          heal_attempts_24h: number | null
          is_degraded: boolean
          is_healthy: boolean | null
          last_checked_at: string | null
          last_counts: Json | null
          last_error_at: string | null
          last_failure_reason: string | null
          last_heal_attempt_at: string | null
          last_run_at: string | null
          last_success_at: string | null
          max_age_days: number | null
          median_job_age_days: number | null
          source: string
          source_mode: string | null
          success_count_24h: number | null
          updated_at: string
        }
        Insert: {
          auto_heal_enabled?: boolean | null
          consecutive_failures?: number
          heal_attempts_24h?: number | null
          is_degraded?: boolean
          is_healthy?: boolean | null
          last_checked_at?: string | null
          last_counts?: Json | null
          last_error_at?: string | null
          last_failure_reason?: string | null
          last_heal_attempt_at?: string | null
          last_run_at?: string | null
          last_success_at?: string | null
          max_age_days?: number | null
          median_job_age_days?: number | null
          source: string
          source_mode?: string | null
          success_count_24h?: number | null
          updated_at?: string
        }
        Update: {
          auto_heal_enabled?: boolean | null
          consecutive_failures?: number
          heal_attempts_24h?: number | null
          is_degraded?: boolean
          is_healthy?: boolean | null
          last_checked_at?: string | null
          last_counts?: Json | null
          last_error_at?: string | null
          last_failure_reason?: string | null
          last_heal_attempt_at?: string | null
          last_run_at?: string | null
          last_success_at?: string | null
          max_age_days?: number | null
          median_job_age_days?: number | null
          source?: string
          source_mode?: string | null
          success_count_24h?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      job_source_performance: {
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
          slug: string | null
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
          slug?: string | null
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
          slug?: string | null
          source_key?: string
          update_frequency?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          ats_type: string | null
          benefits: Json | null
          company: string | null
          company_logo_url: string | null
          company_size: string | null
          competitiveness_level: string | null
          created_at: string | null
          dedup_key: string | null
          description: string | null
          education_level: string | null
          effective_posted_date: string | null
          employment_type: string | null
          enrichment_confidence: number
          experience_years_max: number | null
          experience_years_min: number | null
          external_id: string | null
          external_job_id: string | null
          external_source: string | null
          external_url: string | null
          extracted_structure: Json | null
          id: string
          industry: string | null
          is_active: boolean | null
          is_direct: boolean
          is_official: boolean | null
          job_type: string | null
          keywords: string[] | null
          location: string | null
          match_reasons: Json | null
          match_score: number | null
          normalized_company: string | null
          normalized_location: string | null
          normalized_title: string | null
          original_posting_url: string | null
          posted_date: string | null
          preferred_skills: string[] | null
          probability_estimate: number | null
          ranking_score: number | null
          raw: Json | null
          raw_payload: Json | null
          remote_type: string | null
          required_skills: string[] | null
          requirements: Json | null
          responsibilities: Json | null
          salary_max: number | null
          salary_min: number | null
          salary_range: string | null
          saved_date: string | null
          seniority_level: string | null
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
          ats_type?: string | null
          benefits?: Json | null
          company?: string | null
          company_logo_url?: string | null
          company_size?: string | null
          competitiveness_level?: string | null
          created_at?: string | null
          dedup_key?: string | null
          description?: string | null
          education_level?: string | null
          effective_posted_date?: string | null
          employment_type?: string | null
          enrichment_confidence?: number
          experience_years_max?: number | null
          experience_years_min?: number | null
          external_id?: string | null
          external_job_id?: string | null
          external_source?: string | null
          external_url?: string | null
          extracted_structure?: Json | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_direct?: boolean
          is_official?: boolean | null
          job_type?: string | null
          keywords?: string[] | null
          location?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          normalized_company?: string | null
          normalized_location?: string | null
          normalized_title?: string | null
          original_posting_url?: string | null
          posted_date?: string | null
          preferred_skills?: string[] | null
          probability_estimate?: number | null
          ranking_score?: number | null
          raw?: Json | null
          raw_payload?: Json | null
          remote_type?: string | null
          required_skills?: string[] | null
          requirements?: Json | null
          responsibilities?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          salary_range?: string | null
          saved_date?: string | null
          seniority_level?: string | null
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
          ats_type?: string | null
          benefits?: Json | null
          company?: string | null
          company_logo_url?: string | null
          company_size?: string | null
          competitiveness_level?: string | null
          created_at?: string | null
          dedup_key?: string | null
          description?: string | null
          education_level?: string | null
          effective_posted_date?: string | null
          employment_type?: string | null
          enrichment_confidence?: number
          experience_years_max?: number | null
          experience_years_min?: number | null
          external_id?: string | null
          external_job_id?: string | null
          external_source?: string | null
          external_url?: string | null
          extracted_structure?: Json | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_direct?: boolean
          is_official?: boolean | null
          job_type?: string | null
          keywords?: string[] | null
          location?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          normalized_company?: string | null
          normalized_location?: string | null
          normalized_title?: string | null
          original_posting_url?: string | null
          posted_date?: string | null
          preferred_skills?: string[] | null
          probability_estimate?: number | null
          ranking_score?: number | null
          raw?: Json | null
          raw_payload?: Json | null
          remote_type?: string | null
          required_skills?: string[] | null
          requirements?: Json | null
          responsibilities?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          salary_range?: string | null
          saved_date?: string | null
          seniority_level?: string | null
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
      learning_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          resource_name: string | null
          resource_url: string | null
          skill: string
          skill_gap_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          resource_name?: string | null
          resource_url?: string | null
          skill: string
          skill_gap_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          resource_name?: string | null
          resource_url?: string | null
          skill?: string
          skill_gap_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_skill_gap_id_fkey"
            columns: ["skill_gap_id"]
            isOneToOne: false
            referencedRelation: "skill_gap_analyses"
            referencedColumns: ["id"]
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
      learning_recommendations: {
        Row: {
          created_at: string | null
          estimated_duration_weeks: number | null
          expires_at: string | null
          id: string
          persona_id: string | null
          reason_text: string | null
          recommended_courses: Json | null
          target_skill: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          estimated_duration_weeks?: number | null
          expires_at?: string | null
          id?: string
          persona_id?: string | null
          reason_text?: string | null
          recommended_courses?: Json | null
          target_skill: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          estimated_duration_weeks?: number | null
          expires_at?: string | null
          id?: string
          persona_id?: string | null
          reason_text?: string | null
          recommended_courses?: Json | null
          target_skill?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_recommendations_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
            referencedColumns: ["id"]
          },
        ]
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
      linkedin_profiles: {
        Row: {
          analysis_results: Json | null
          created_at: string | null
          id: string
          is_public: boolean | null
          linkedin_url: string
          profile_data: Json
          share_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_results?: Json | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          linkedin_url: string
          profile_data: Json
          share_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_results?: Json | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          linkedin_url?: string
          profile_data?: Json
          share_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiation_sessions: {
        Row: {
          company: string | null
          created_at: string | null
          id: string
          offer_details: Json | null
          position: string
          scripts: string[] | null
          strategy: string | null
          target_range: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          id?: string
          offer_details?: Json | null
          position: string
          scripts?: string[] | null
          strategy?: string | null
          target_range?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          id?: string
          offer_details?: Json | null
          position?: string
          scripts?: string[] | null
          strategy?: string | null
          target_range?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      networking_contacts: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          linkedin_url: string | null
          name: string
          notes: string | null
          role: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          notes?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      outreach_logs: {
        Row: {
          contact_id: string
          id: string
          message_content: string | null
          method: string | null
          response_received: boolean | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          id?: string
          message_content?: string | null
          method?: string | null
          response_received?: boolean | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          id?: string
          message_content?: string | null
          method?: string | null
          response_received?: boolean | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "networking_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_templates: {
        Row: {
          content: string
          id: string
          name: string
          type: string | null
          user_id: string
        }
        Insert: {
          content: string
          id?: string
          name: string
          type?: string | null
          user_id: string
        }
        Update: {
          content?: string
          id?: string
          name?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      persona_preferences: {
        Row: {
          company_size: string[] | null
          created_at: string | null
          excluded_companies: string[] | null
          growth_focus: string[] | null
          id: string
          industries: string[] | null
          job_title_keywords: string[] | null
          locations: string[] | null
          max_salary: number | null
          min_salary: number | null
          mission_values: string[] | null
          nice_to_have_skills: string[] | null
          persona_id: string
          remote_preference: string | null
          required_skills: string[] | null
          updated_at: string | null
          voice_conciseness: number | null
          voice_formality: number | null
          voice_playfulness: number | null
        }
        Insert: {
          company_size?: string[] | null
          created_at?: string | null
          excluded_companies?: string[] | null
          growth_focus?: string[] | null
          id?: string
          industries?: string[] | null
          job_title_keywords?: string[] | null
          locations?: string[] | null
          max_salary?: number | null
          min_salary?: number | null
          mission_values?: string[] | null
          nice_to_have_skills?: string[] | null
          persona_id: string
          remote_preference?: string | null
          required_skills?: string[] | null
          updated_at?: string | null
          voice_conciseness?: number | null
          voice_formality?: number | null
          voice_playfulness?: number | null
        }
        Update: {
          company_size?: string[] | null
          created_at?: string | null
          excluded_companies?: string[] | null
          growth_focus?: string[] | null
          id?: string
          industries?: string[] | null
          job_title_keywords?: string[] | null
          locations?: string[] | null
          max_salary?: number | null
          min_salary?: number | null
          mission_values?: string[] | null
          nice_to_have_skills?: string[] | null
          persona_id?: string
          remote_preference?: string | null
          required_skills?: string[] | null
          updated_at?: string | null
          voice_conciseness?: number | null
          voice_formality?: number | null
          voice_playfulness?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_preferences_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: true
            referencedRelation: "user_personas"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_analyses: {
        Row: {
          analysis_results: Json | null
          created_at: string | null
          id: string
          is_public: boolean | null
          portfolio_url: string
          share_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_results?: Json | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          portfolio_url: string
          share_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_results?: Json | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          portfolio_url?: string
          share_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          career_narrative_future: string | null
          career_narrative_origin: string | null
          career_narrative_pivot: string | null
          career_narrative_value: string | null
          career_priorities: Json | null
          created_at: string | null
          current_role_title: string | null
          email: string
          enable_experimental_features: boolean | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          last_narrative_generated_at: string | null
          layout_density: string | null
          location: string | null
          notif_application_updates: boolean | null
          notif_high_match: boolean | null
          notif_weekly_digest: boolean | null
          onboarding_completed: boolean | null
          onboarding_state: Json | null
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
          career_narrative_future?: string | null
          career_narrative_origin?: string | null
          career_narrative_pivot?: string | null
          career_narrative_value?: string | null
          career_priorities?: Json | null
          created_at?: string | null
          current_role_title?: string | null
          email: string
          enable_experimental_features?: boolean | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          last_narrative_generated_at?: string | null
          layout_density?: string | null
          location?: string | null
          notif_application_updates?: boolean | null
          notif_high_match?: boolean | null
          notif_weekly_digest?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_state?: Json | null
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
          career_narrative_future?: string | null
          career_narrative_origin?: string | null
          career_narrative_pivot?: string | null
          career_narrative_value?: string | null
          career_priorities?: Json | null
          created_at?: string | null
          current_role_title?: string | null
          email?: string
          enable_experimental_features?: boolean | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_narrative_generated_at?: string | null
          layout_density?: string | null
          location?: string | null
          notif_application_updates?: boolean | null
          notif_high_match?: boolean | null
          notif_weekly_digest?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_state?: Json | null
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
      readiness_snapshots: {
        Row: {
          assessment_score: number | null
          created_at: string | null
          id: string
          narrative_score: number | null
          overall_score: number | null
          practice_score: number | null
          skills_score: number | null
          snapshot_date: string | null
          user_id: string
        }
        Insert: {
          assessment_score?: number | null
          created_at?: string | null
          id?: string
          narrative_score?: number | null
          overall_score?: number | null
          practice_score?: number | null
          skills_score?: number | null
          snapshot_date?: string | null
          user_id: string
        }
        Update: {
          assessment_score?: number | null
          created_at?: string | null
          id?: string
          narrative_score?: number | null
          overall_score?: number | null
          practice_score?: number | null
          skills_score?: number | null
          snapshot_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ready_profiles: {
        Row: {
          assessments_completed: number | null
          created_at: string | null
          display_name: string | null
          focus_areas: string[] | null
          goal: string | null
          headline: string | null
          id: string
          last_practice_date: string | null
          readiness_score: number | null
          updated_at: string | null
        }
        Insert: {
          assessments_completed?: number | null
          created_at?: string | null
          display_name?: string | null
          focus_areas?: string[] | null
          goal?: string | null
          headline?: string | null
          id: string
          last_practice_date?: string | null
          readiness_score?: number | null
          updated_at?: string | null
        }
        Update: {
          assessments_completed?: number | null
          created_at?: string | null
          display_name?: string | null
          focus_areas?: string[] | null
          goal?: string | null
          headline?: string | null
          id?: string
          last_practice_date?: string | null
          readiness_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      relevance_tuner_settings: {
        Row: {
          created_at: string | null
          id: string
          industry_weight: number | null
          is_default: boolean | null
          location_weight: number | null
          name: string
          remote_weight: number | null
          salary_weight: number | null
          skill_weight: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry_weight?: number | null
          is_default?: boolean | null
          location_weight?: number | null
          name: string
          remote_weight?: number | null
          salary_weight?: number | null
          skill_weight?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          industry_weight?: number | null
          is_default?: boolean | null
          location_weight?: number | null
          name?: string
          remote_weight?: number | null
          salary_weight?: number | null
          skill_weight?: number | null
          updated_at?: string | null
          user_id?: string
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
          file_name: string | null
          file_size_bytes: number | null
          id: string
          is_default: boolean | null
          keywords: Json | null
          languages: Json | null
          last_optimization_date: string | null
          mime_type: string | null
          optimization_history: Json | null
          parsed_fields: Json | null
          parsed_text: string | null
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
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          is_default?: boolean | null
          keywords?: Json | null
          languages?: Json | null
          last_optimization_date?: string | null
          mime_type?: string | null
          optimization_history?: Json | null
          parsed_fields?: Json | null
          parsed_text?: string | null
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
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          is_default?: boolean | null
          keywords?: Json | null
          languages?: Json | null
          last_optimization_date?: string | null
          mime_type?: string | null
          optimization_history?: Json | null
          parsed_fields?: Json | null
          parsed_text?: string | null
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
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queue: {
        Row: {
          created_at: string | null
          id: string
          keywords: string | null
          last_result_count: number | null
          last_run_at: string | null
          location: string | null
          next_run_after: string | null
          params: Json | null
          priority: number | null
          run_count: number | null
          source_slug: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          keywords?: string | null
          last_result_count?: number | null
          last_run_at?: string | null
          location?: string | null
          next_run_after?: string | null
          params?: Json | null
          priority?: number | null
          run_count?: number | null
          source_slug: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          keywords?: string | null
          last_result_count?: number | null
          last_run_at?: string | null
          location?: string | null
          next_run_after?: string | null
          params?: Json | null
          priority?: number | null
          run_count?: number | null
          source_slug?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_gap_analyses: {
        Row: {
          action_plan: string | null
          created_at: string | null
          current_skills: string[] | null
          gaps: Json
          id: string
          status: string | null
          strengths: string[] | null
          target_role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_plan?: string | null
          created_at?: string | null
          current_skills?: string[] | null
          gaps?: Json
          id?: string
          status?: string | null
          strengths?: string[] | null
          target_role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_plan?: string | null
          created_at?: string | null
          current_skills?: string[] | null
          gaps?: Json
          id?: string
          status?: string | null
          strengths?: string[] | null
          target_role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      source_performance_metrics: {
        Row: {
          avg_jobs_per_run_30d: number | null
          avg_jobs_per_run_7d: number | null
          consecutive_failures: number | null
          failed_runs_30d: number | null
          failed_runs_7d: number | null
          health_factors: Json | null
          health_score: number | null
          is_degraded: boolean | null
          last_error: string | null
          last_error_at: string | null
          last_run_at: string | null
          source_slug: string
          success_rate_30d: number | null
          success_rate_7d: number | null
          total_runs_30d: number | null
          total_runs_7d: number | null
          updated_at: string | null
        }
        Insert: {
          avg_jobs_per_run_30d?: number | null
          avg_jobs_per_run_7d?: number | null
          consecutive_failures?: number | null
          failed_runs_30d?: number | null
          failed_runs_7d?: number | null
          health_factors?: Json | null
          health_score?: number | null
          is_degraded?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_run_at?: string | null
          source_slug: string
          success_rate_30d?: number | null
          success_rate_7d?: number | null
          total_runs_30d?: number | null
          total_runs_7d?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_jobs_per_run_30d?: number | null
          avg_jobs_per_run_7d?: number | null
          consecutive_failures?: number | null
          failed_runs_30d?: number | null
          failed_runs_7d?: number | null
          health_factors?: Json | null
          health_score?: number | null
          is_degraded?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_run_at?: string | null
          source_slug?: string
          success_rate_30d?: number | null
          success_rate_7d?: number | null
          total_runs_30d?: number | null
          total_runs_7d?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      source_rate_limits: {
        Row: {
          cooldown_minutes: number | null
          is_active: boolean | null
          max_per_hour: number | null
          source_slug: string
          updated_at: string | null
        }
        Insert: {
          cooldown_minutes?: number | null
          is_active?: boolean | null
          max_per_hour?: number | null
          source_slug: string
          updated_at?: string | null
        }
        Update: {
          cooldown_minutes?: number | null
          is_active?: boolean | null
          max_per_hour?: number | null
          source_slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      strategic_pivot_reports: {
        Row: {
          created_at: string | null
          generated_at: string | null
          id: string
          insights: Json
          interview_rate: number | null
          offer_rate: number | null
          period_end: string
          period_start: string
          recommendations: Json
          recommendations_applied: Json | null
          recommendations_dismissed: Json | null
          response_rate: number | null
          total_applications: number
          total_interviews: number
          total_offers: number
          total_rejections: number
          total_responses: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          insights?: Json
          interview_rate?: number | null
          offer_rate?: number | null
          period_end: string
          period_start: string
          recommendations?: Json
          recommendations_applied?: Json | null
          recommendations_dismissed?: Json | null
          response_rate?: number | null
          total_applications?: number
          total_interviews?: number
          total_offers?: number
          total_rejections?: number
          total_responses?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          insights?: Json
          interview_rate?: number | null
          offer_rate?: number | null
          period_end?: string
          period_start?: string
          recommendations?: Json
          recommendations_applied?: Json | null
          recommendations_dismissed?: Json | null
          response_rate?: number | null
          total_applications?: number
          total_interviews?: number
          total_offers?: number
          total_rejections?: number
          total_responses?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_alert_history: {
        Row: {
          alert_type: string
          id: string
          job_id: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          id?: string
          job_id: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          id?: string
          job_id?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_alert_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_alert_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      user_keyword_preferences: {
        Row: {
          avoid_keywords: string[]
          created_at: string
          include_keywords: string[]
          learning_style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avoid_keywords?: string[]
          created_at?: string
          include_keywords?: string[]
          learning_style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avoid_keywords?: string[]
          created_at?: string
          include_keywords?: string[]
          learning_style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_keyword_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_keywords: {
        Row: {
          keywords: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          keywords: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          keywords?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_match_preferences: {
        Row: {
          created_at: string
          location_mode: string
          min_salary_local: number | null
          min_salary_relocate: number | null
          min_salary_remote: number | null
          updated_at: string
          user_id: string
          weight_growth: number
          weight_location: number
          weight_mission: number
          weight_remote: number
          weight_salary: number
        }
        Insert: {
          created_at?: string
          location_mode?: string
          min_salary_local?: number | null
          min_salary_relocate?: number | null
          min_salary_remote?: number | null
          updated_at?: string
          user_id: string
          weight_growth?: number
          weight_location?: number
          weight_mission?: number
          weight_remote?: number
          weight_salary?: number
        }
        Update: {
          created_at?: string
          location_mode?: string
          min_salary_local?: number | null
          min_salary_relocate?: number | null
          min_salary_remote?: number | null
          updated_at?: string
          user_id?: string
          weight_growth?: number
          weight_location?: number
          weight_mission?: number
          weight_remote?: number
          weight_salary?: number
        }
        Relationships: []
      }
      user_pattern_insights: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          insight_data: Json
          insight_message: string
          insight_title: string
          insight_type: string
          is_dismissed: boolean | null
          priority: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insight_data?: Json
          insight_message: string
          insight_title: string
          insight_type: string
          is_dismissed?: boolean | null
          priority?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insight_data?: Json
          insight_message?: string
          insight_title?: string
          insight_type?: string
          is_dismissed?: boolean | null
          priority?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_personas: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          resume_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          resume_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          resume_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_personas_resume"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_professional_profiles: {
        Row: {
          created_at: string
          earliest_start_raw: string | null
          evergreen_strengths_polished: string | null
          evergreen_strengths_raw: string | null
          evergreen_why_polished: string | null
          evergreen_why_raw: string | null
          headline_polished: string | null
          headline_raw: string | null
          links: string[] | null
          links_raw: string | null
          needs_sponsorship: boolean | null
          relocate_notes: string | null
          relocate_preference: string | null
          summary_polished: string | null
          summary_raw: string | null
          target_roles: string[] | null
          target_roles_raw: string | null
          top_skills: string[] | null
          top_skills_raw: string | null
          travel_preference: string | null
          updated_at: string
          user_id: string
          work_auth_raw: string | null
          work_types: string[] | null
        }
        Insert: {
          created_at?: string
          earliest_start_raw?: string | null
          evergreen_strengths_polished?: string | null
          evergreen_strengths_raw?: string | null
          evergreen_why_polished?: string | null
          evergreen_why_raw?: string | null
          headline_polished?: string | null
          headline_raw?: string | null
          links?: string[] | null
          links_raw?: string | null
          needs_sponsorship?: boolean | null
          relocate_notes?: string | null
          relocate_preference?: string | null
          summary_polished?: string | null
          summary_raw?: string | null
          target_roles?: string[] | null
          target_roles_raw?: string | null
          top_skills?: string[] | null
          top_skills_raw?: string | null
          travel_preference?: string | null
          updated_at?: string
          user_id: string
          work_auth_raw?: string | null
          work_types?: string[] | null
        }
        Update: {
          created_at?: string
          earliest_start_raw?: string | null
          evergreen_strengths_polished?: string | null
          evergreen_strengths_raw?: string | null
          evergreen_why_polished?: string | null
          evergreen_why_raw?: string | null
          headline_polished?: string | null
          headline_raw?: string | null
          links?: string[] | null
          links_raw?: string | null
          needs_sponsorship?: boolean | null
          relocate_notes?: string | null
          relocate_preference?: string | null
          summary_polished?: string | null
          summary_raw?: string | null
          target_roles?: string[] | null
          target_roles_raw?: string | null
          top_skills?: string[] | null
          top_skills_raw?: string | null
          travel_preference?: string | null
          updated_at?: string
          user_id?: string
          work_auth_raw?: string | null
          work_types?: string[] | null
        }
        Relationships: []
      }
      user_search_interests: {
        Row: {
          created_at: string | null
          id: string
          keywords: string
          last_seeded_at: string | null
          location: string | null
          updated_at: string | null
          user_count: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          keywords: string
          last_seeded_at?: string | null
          location?: string | null
          updated_at?: string | null
          user_count?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          keywords?: string
          last_seeded_at?: string | null
          location?: string | null
          updated_at?: string | null
          user_count?: number | null
          weight?: number | null
        }
        Relationships: []
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
      user_skills: {
        Row: {
          created_at: string | null
          id: string
          proficiency_level: string | null
          skill_name: string
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          proficiency_level?: string | null
          skill_name: string
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          proficiency_level?: string | null
          skill_name?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_profiles: {
        Row: {
          created_at: string | null
          id: string
          preset_name: string | null
          settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preset_name?: string | null
          settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preset_name?: string | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wellness_checkins: {
        Row: {
          created_at: string | null
          id: string
          mood_score: number | null
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mood_score?: number | null
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mood_score?: number | null
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      companies_priority_queue: {
        Row: {
          domain: string | null
          employee_count: number | null
          founding_year: number | null
          funding_stage: string | null
          greenhouse_board_token: string | null
          id: string | null
          industry: string | null
          last_synced_at: string | null
          lever_slug: string | null
          name: string | null
          priority_score: number | null
          priority_tier: string | null
        }
        Relationships: []
      }
      company_ingestion_queue: {
        Row: {
          domain: string | null
          estimated_jobs_per_week: number | null
          greenhouse_board_token: string | null
          growth_score: number | null
          id: string | null
          ingestion_priority_score: number | null
          job_creation_velocity: number | null
          last_synced_at: string | null
          lever_slug: string | null
          name: string | null
          priority_tier: string | null
        }
        Relationships: []
      }
      discovery_summary: {
        Row: {
          avg_duration_ms: number | null
          companies_added: number | null
          companies_discovered: number | null
          failed_runs: number | null
          growth_companies: number | null
          max_duration_ms: number | null
          platforms_detected: number | null
          priorities_updated: number | null
          run_date: string | null
          successful_runs: number | null
          total_runs: number | null
        }
        Relationships: []
      }
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
      jobs_normalized: {
        Row: {
          company: string | null
          competitiveness_level: string | null
          created_at: string | null
          employment_type: string | null
          external_url: string | null
          has_salary: boolean | null
          id: string | null
          location: string | null
          match_score: number | null
          posted_date: string | null
          remote_type: string | null
          salary_max: number | null
          salary_min: number | null
          source_slug: string | null
          title: string | null
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
      compute_job_dedup_key: {
        Args: { p_company: string; p_location: string; p_title: string }
        Returns: string
      }
      extract_keywords: { Args: { input_text: string }; Returns: string[] }
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
      match_jobs_for_user: {
        Args: { p_user_id: string }
        Returns: {
          company: string
          job_id: string
          score: number
          title: string
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      upsert_jobs_counted: {
        Args: { jobs: Json }
        Returns: {
          inserted_count: number
          noop_count: number
          updated_count: number
        }[]
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
