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
      admin_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auto_actions: {
        Row: {
          action_date: string
          action_text: string
          action_type: string
          completed_at: string | null
          created_at: string | null
          domain_id: number | null
          hub_id: number | null
          id: number
          priority: number | null
          status: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          action_date: string
          action_text: string
          action_type: string
          completed_at?: string | null
          created_at?: string | null
          domain_id?: number | null
          hub_id?: number | null
          id?: number
          priority?: number | null
          status?: string | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          action_date?: string
          action_text?: string
          action_type?: string
          completed_at?: string | null
          created_at?: string | null
          domain_id?: number | null
          hub_id?: number | null
          id?: number
          priority?: number | null
          status?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_actions_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "ultra_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_actions_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_action_queue: {
        Row: {
          action_payload: Json
          action_type: string
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          id: number
          max_retries: number | null
          priority: number | null
          retry_count: number | null
          rule_id: number | null
          scheduled_for: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_payload: Json
          action_type: string
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: number
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          rule_id?: number | null
          scheduled_for?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_payload?: Json
          action_type?: string
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: number
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          rule_id?: number | null
          scheduled_for?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_action_queue_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_action_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_context_cache: {
        Row: {
          cache_key: string
          cache_value: Json
          created_at: string | null
          expires_at: string
          id: number
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          cache_key: string
          cache_value: Json
          created_at?: string | null
          expires_at: string
          id?: number
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          cache_key?: string
          cache_value?: Json
          created_at?: string | null
          expires_at?: string
          id?: number
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_context_cache_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          actions_executed: Json | null
          conditions_met: Json | null
          created_at: string | null
          execution_date: string | null
          execution_result: string | null
          id: number
          rule_id: number | null
          tenant_id: string | null
          trigger_type: string
          user_id: string
        }
        Insert: {
          actions_executed?: Json | null
          conditions_met?: Json | null
          created_at?: string | null
          execution_date?: string | null
          execution_result?: string | null
          id?: number
          rule_id?: number | null
          tenant_id?: string | null
          trigger_type: string
          user_id: string
        }
        Update: {
          actions_executed?: Json | null
          conditions_met?: Json | null
          created_at?: string | null
          execution_date?: string | null
          execution_result?: string | null
          id?: number
          rule_id?: number | null
          tenant_id?: string | null
          trigger_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          context_data: Json | null
          created_at: string | null
          event_type: string
          id: number
          message: string
          rule_id: number | null
          severity: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          created_at?: string | null
          event_type: string
          id?: number
          message: string
          rule_id?: number | null
          severity?: string | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          context_data?: Json | null
          created_at?: string | null
          event_type?: string
          id?: number
          message?: string
          rule_id?: number | null
          severity?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rule_actions: {
        Row: {
          action_payload: Json | null
          action_type: string
          created_at: string | null
          id: number
          priority: number | null
          rule_id: number
        }
        Insert: {
          action_payload?: Json | null
          action_type: string
          created_at?: string | null
          id?: number
          priority?: number | null
          rule_id: number
        }
        Update: {
          action_payload?: Json | null
          action_type?: string
          created_at?: string | null
          id?: number
          priority?: number | null
          rule_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_rule_actions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rule_conditions: {
        Row: {
          comparison_window: number | null
          condition_type: string
          created_at: string | null
          id: number
          metric_name: string | null
          operator: string
          rule_id: number
          threshold_value: number | null
        }
        Insert: {
          comparison_window?: number | null
          condition_type: string
          created_at?: string | null
          id?: number
          metric_name?: string | null
          operator: string
          rule_id: number
          threshold_value?: number | null
        }
        Update: {
          comparison_window?: number | null
          condition_type?: string
          created_at?: string | null
          id?: number
          metric_name?: string | null
          operator?: string
          rule_id?: number
          threshold_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rule_conditions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_target: string
          action_value: string | null
          condition_type: string
          condition_value: number | null
          conflict_group: string | null
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          priority: number | null
          requires_user_confirmation: boolean | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          action_target: string
          action_value?: string | null
          condition_type: string
          condition_value?: number | null
          conflict_group?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          priority?: number | null
          requires_user_confirmation?: boolean | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          action_target?: string
          action_value?: string | null
          condition_type?: string
          condition_value?: number | null
          conflict_group?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          priority?: number | null
          requires_user_confirmation?: boolean | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      automation_trigger_events: {
        Row: {
          created_at: string | null
          id: number
          processed: boolean | null
          tenant_id: string | null
          trigger_data: Json | null
          trigger_source: string
          trigger_type: string
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          processed?: boolean | null
          tenant_id?: string | null
          trigger_data?: Json | null
          trigger_source: string
          trigger_type: string
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          processed?: boolean | null
          tenant_id?: string | null
          trigger_data?: Json | null
          trigger_source?: string
          trigger_type?: string
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_trigger_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_entries: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          end_time: string | null
          focus_domain: string | null
          hub_id: number | null
          id: number
          start_time: string | null
          tenant_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          end_time?: string | null
          focus_domain?: string | null
          hub_id?: number | null
          id?: number
          start_time?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          focus_domain?: string | null
          hub_id?: number | null
          id?: number
          start_time?: string | null
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_entries_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_checkins: {
        Row: {
          created_at: string | null
          date: string
          done: boolean | null
          habit_id: number
          id: number
        }
        Insert: {
          created_at?: string | null
          date: string
          done?: boolean | null
          habit_id: number
          id?: number
        }
        Update: {
          created_at?: string | null
          date?: string
          done?: boolean | null
          habit_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_checkins_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          last_checkin: string | null
          name: string
          streak: number | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          last_checkin?: string | null
          name: string
          streak?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          last_checkin?: string | null
          name?: string
          streak?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hubs: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          id: number
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          created_at: string | null
          hub_id: number | null
          id: number
          log_date: string
          metric: string | null
          notes: string | null
          source: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string | null
          hub_id?: number | null
          id?: number
          log_date: string
          metric?: string | null
          notes?: string | null
          source: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string | null
          hub_id?: number | null
          id?: number
          log_date?: string
          metric?: string | null
          notes?: string | null
          source?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          invited_email: string | null
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          created_at: string | null
          hub_id: number | null
          id: number
          metric_date: string
          name: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          hub_id?: number | null
          id?: number
          metric_date: string
          name: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          hub_id?: number | null
          id?: number
          metric_date?: string
          name?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          calendar_alerts_enabled: boolean | null
          created_at: string | null
          habit_reminders_enabled: boolean | null
          id: string
          intensity_level: string | null
          life_event_alerts_enabled: boolean | null
          max_notifications_per_hour: number | null
          monthly_reports_enabled: boolean | null
          performance_alerts_enabled: boolean | null
          project_alerts_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
          weekly_reports_enabled: boolean | null
        }
        Insert: {
          calendar_alerts_enabled?: boolean | null
          created_at?: string | null
          habit_reminders_enabled?: boolean | null
          id?: string
          intensity_level?: string | null
          life_event_alerts_enabled?: boolean | null
          max_notifications_per_hour?: number | null
          monthly_reports_enabled?: boolean | null
          performance_alerts_enabled?: boolean | null
          project_alerts_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
          weekly_reports_enabled?: boolean | null
        }
        Update: {
          calendar_alerts_enabled?: boolean | null
          created_at?: string | null
          habit_reminders_enabled?: boolean | null
          id?: string
          intensity_level?: string | null
          life_event_alerts_enabled?: boolean | null
          max_notifications_per_hour?: number | null
          monthly_reports_enabled?: boolean | null
          performance_alerts_enabled?: boolean | null
          project_alerts_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_reports_enabled?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          resolved_at: string | null
          severity: string
          tenant_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          severity?: string
          tenant_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          severity?: string
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          due_date: string | null
          hub_id: number | null
          id: number
          notes: string | null
          priority: string | null
          sprint: string | null
          status: string | null
          tenant_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          hub_id?: number | null
          id?: number
          notes?: string | null
          priority?: string | null
          sprint?: string | null
          status?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          hub_id?: number | null
          id?: number
          notes?: string | null
          priority?: string | null
          sprint?: string | null
          status?: string | null
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_settings: {
        Row: {
          account_locked_until: string | null
          created_at: string
          id: string
          last_failed_login: string | null
          login_attempts: number
          mfa_enabled: boolean
          mfa_secret: string | null
          password_changed_at: string | null
          session_timeout_minutes: number
          trusted_ips: unknown[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_locked_until?: string | null
          created_at?: string
          id?: string
          last_failed_login?: string | null
          login_attempts?: number
          mfa_enabled?: boolean
          mfa_secret?: string | null
          password_changed_at?: string | null
          session_timeout_minutes?: number
          trusted_ips?: unknown[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_locked_until?: string | null
          created_at?: string
          id?: string
          last_failed_login?: string | null
          login_attempts?: number
          mfa_enabled?: boolean
          mfa_secret?: string | null
          password_changed_at?: string | null
          session_timeout_minutes?: number
          trusted_ips?: unknown[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      state_warnings: {
        Row: {
          created_at: string | null
          dismissed: boolean | null
          dismissed_at: string | null
          id: number
          related_habit_id: number | null
          related_hub_id: number | null
          related_project_id: number | null
          severity: string | null
          tenant_id: string | null
          user_id: string
          warning_text: string
          warning_type: string
        }
        Insert: {
          created_at?: string | null
          dismissed?: boolean | null
          dismissed_at?: string | null
          id?: number
          related_habit_id?: number | null
          related_hub_id?: number | null
          related_project_id?: number | null
          severity?: string | null
          tenant_id?: string | null
          user_id: string
          warning_text: string
          warning_type: string
        }
        Update: {
          created_at?: string | null
          dismissed?: boolean | null
          dismissed_at?: string | null
          id?: number
          related_habit_id?: number | null
          related_hub_id?: number | null
          related_project_id?: number | null
          severity?: string | null
          tenant_id?: string | null
          user_id?: string
          warning_text?: string
          warning_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "state_warnings_related_habit_id_fkey"
            columns: ["related_habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_warnings_related_hub_id_fkey"
            columns: ["related_hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_warnings_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_warnings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_state_daily: {
        Row: {
          created_at: string | null
          id: number
          priority_zone: string | null
          state: string
          state_date: string
          state_reasons: Json | null
          strongest_hub_id: number | null
          tenant_id: string | null
          ultra_score: number
          user_id: string
          weakest_hub_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          priority_zone?: string | null
          state: string
          state_date: string
          state_reasons?: Json | null
          strongest_hub_id?: number | null
          tenant_id?: string | null
          ultra_score: number
          user_id: string
          weakest_hub_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          priority_zone?: string | null
          state?: string
          state_date?: string
          state_reasons?: Json | null
          strongest_hub_id?: number | null
          tenant_id?: string | null
          ultra_score?: number
          user_id?: string
          weakest_hub_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "system_state_daily_strongest_hub_id_fkey"
            columns: ["strongest_hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_state_daily_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_state_daily_weakest_hub_id_fkey"
            columns: ["weakest_hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: number
          importance: number | null
          priority: string | null
          project_id: number
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          importance?: number | null
          priority?: string | null
          project_id: number
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          importance?: number | null
          priority?: string | null
          project_id?: number
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ultra_domains: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      ultra_metrics: {
        Row: {
          created_at: string | null
          domain_id: number | null
          id: number
          metric_date: string
          name: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          domain_id?: number | null
          id?: number
          metric_date: string
          name: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          domain_id?: number | null
          id?: number
          metric_date?: string
          name?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "ultra_metrics_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "ultra_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ultra_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ultra_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_automation_settings: {
        Row: {
          automation_enabled: boolean | null
          created_at: string | null
          enabled_categories: Json | null
          id: number
          max_daily_actions: number | null
          notification_preferences: Json | null
          priority_override: string | null
          quiet_hours: Json | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          automation_enabled?: boolean | null
          created_at?: string | null
          enabled_categories?: Json | null
          id?: number
          max_daily_actions?: number | null
          notification_preferences?: Json | null
          priority_override?: string | null
          quiet_hours?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          automation_enabled?: boolean | null
          created_at?: string | null
          enabled_categories?: Json | null
          id?: number
          max_daily_actions?: number | null
          notification_preferences?: Json | null
          priority_override?: string | null
          quiet_hours?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_automation_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_metrics_overview: {
        Row: {
          active_hubs: number | null
          active_users: number | null
          avg_ultra_score: number | null
          logs_today: number | null
          total_logs: number | null
        }
        Relationships: []
      }
      admin_user_stats: {
        Row: {
          enterprise_subscribers: number | null
          new_users_month: number | null
          new_users_today: number | null
          new_users_week: number | null
          pro_subscribers: number | null
          starter_subscribers: number | null
          total_tenants: number | null
          total_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_tenant_role: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["membership_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["membership_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_details: Json
          p_event_type: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "member" | "viewer" | "guest" | "admin"
      membership_role: "owner" | "admin" | "member" | "viewer"
      membership_status: "pending" | "active" | "revoked"
      subscription_plan: "free" | "starter" | "pro" | "enterprise"
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
      app_role: ["owner", "member", "viewer", "guest", "admin"],
      membership_role: ["owner", "admin", "member", "viewer"],
      membership_status: ["pending", "active", "revoked"],
      subscription_plan: ["free", "starter", "pro", "enterprise"],
    },
  },
} as const
