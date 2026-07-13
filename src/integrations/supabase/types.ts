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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academy_lessons: {
        Row: {
          audience: string
          closing_bible_reference: string
          closing_bible_text: string
          closing_bible_translation: string
          closing_prayer: string
          content_version: number
          couples_prompt: string | null
          created_at: string
          day_number: number
          devotional: string | null
          disclaimer_type: string
          estimated_minutes: number
          id: string
          individual_prompt: string | null
          is_premium: boolean
          metadata: Json
          module_id: string
          opening_bible_reference: string
          opening_bible_text: string
          opening_bible_translation: string
          opening_prayer: string
          published_at: string | null
          slug: string
          status: string
          subtitle: string | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          audience?: string
          closing_bible_reference: string
          closing_bible_text: string
          closing_bible_translation?: string
          closing_prayer: string
          content_version?: number
          couples_prompt?: string | null
          created_at?: string
          day_number: number
          devotional?: string | null
          disclaimer_type?: string
          estimated_minutes?: number
          id?: string
          individual_prompt?: string | null
          is_premium?: boolean
          metadata?: Json
          module_id: string
          opening_bible_reference: string
          opening_bible_text: string
          opening_bible_translation?: string
          opening_prayer: string
          published_at?: string | null
          slug: string
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          audience?: string
          closing_bible_reference?: string
          closing_bible_text?: string
          closing_bible_translation?: string
          closing_prayer?: string
          content_version?: number
          couples_prompt?: string | null
          created_at?: string
          day_number?: number
          devotional?: string | null
          disclaimer_type?: string
          estimated_minutes?: number
          id?: string
          individual_prompt?: string | null
          is_premium?: boolean
          metadata?: Json
          module_id?: string
          opening_bible_reference?: string
          opening_bible_text?: string
          opening_bible_translation?: string
          opening_prayer?: string
          published_at?: string | null
          slug?: string
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "content_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_modules: {
        Row: {
          created_at: string
          day_end: number
          day_start: number
          description: string | null
          id: string
          level_name: string | null
          module_number: number
          slug: string
          status: string
          subtitle: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          day_end: number
          day_start: number
          description?: string | null
          id?: string
          level_name?: string | null
          module_number: number
          slug: string
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          day_end?: number
          day_start?: number
          description?: string | null
          id?: string
          level_name?: string | null
          module_number?: number
          slug?: string
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          app_version: string | null
          event_name: string
          id: number
          occurred_at: string
          properties: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          event_name: string
          id?: never
          occurred_at?: string
          properties?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          event_name?: string
          id?: never
          occurred_at?: string
          properties?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_channels: {
        Row: {
          conversation_id: string
          created_at: string
          expires_at: string
          helper_alias: string
          id: string
          requester_alias: string
          status: string
          support_request_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          expires_at: string
          helper_alias: string
          id?: string
          requester_alias: string
          status?: string
          support_request_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          expires_at?: string
          helper_alias?: string
          id?: string
          requester_alias?: string
          status?: string
          support_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_channels_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_channels_support_request_id_fkey"
            columns: ["support_request_id"]
            isOneToOne: false
            referencedRelation: "support_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      appeals: {
        Row: {
          appellant_id: string
          case_id: string
          created_at: string
          id: string
          resolved_at: string | null
          statement: string
          status: string
        }
        Insert: {
          appellant_id: string
          case_id: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          statement: string
          status?: string
        }
        Update: {
          appellant_id?: string
          case_id?: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          statement?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appeals_appellant_id_fkey"
            columns: ["appellant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          artwork_path: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          proof_rules: Json
          slug: string
        }
        Insert: {
          artwork_path?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          proof_rules?: Json
          slug: string
        }
        Update: {
          artwork_path?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          proof_rules?: Json
          slug?: string
        }
        Relationships: []
      }
      billing_customers: {
        Row: {
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          created_at: string
          id: string
          provider_customer_id: string
          user_id: string
        }
        Insert: {
          billing_provider?: Database["public"]["Enums"]["billing_provider"]
          created_at?: string
          id?: string
          provider_customer_id: string
          user_id: string
        }
        Update: {
          billing_provider?: Database["public"]["Enums"]["billing_provider"]
          created_at?: string
          id?: string
          provider_customer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_relationships: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          reason_code: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          reason_code?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          reason_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_relationships_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_relationships_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      book_contribution_consents: {
        Row: {
          consent_version: string
          contribution_id: string
          created_at: string
          decision: boolean
          id: string
          user_id: string
        }
        Insert: {
          consent_version: string
          contribution_id: string
          created_at?: string
          decision: boolean
          id?: string
          user_id: string
        }
        Update: {
          consent_version?: string
          contribution_id?: string
          created_at?: string
          decision?: boolean
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_contribution_consents_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "book_contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_contribution_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      book_contributions: {
        Row: {
          book_id: string
          consent_granted: boolean
          consent_version: string | null
          contributor_id: string
          created_at: string
          excerpt_text: string | null
          id: string
          inclusion_mode: string
          sort_order: number
          source_entity_id: string
          source_entity_type: string
        }
        Insert: {
          book_id: string
          consent_granted?: boolean
          consent_version?: string | null
          contributor_id: string
          created_at?: string
          excerpt_text?: string | null
          id?: string
          inclusion_mode: string
          sort_order?: number
          source_entity_id: string
          source_entity_type: string
        }
        Update: {
          book_id?: string
          consent_granted?: boolean
          consent_version?: string | null
          contributor_id?: string
          created_at?: string
          excerpt_text?: string | null
          id?: string
          inclusion_mode?: string
          sort_order?: number
          source_entity_id?: string
          source_entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_contributions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_contributions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          book_type: string
          cover_path: string | null
          created_at: string
          generated_file_path: string | null
          id: string
          layout: Json
          owner_id: string
          scope_id: string | null
          scope_type: string
          status: string
          subtitle: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          book_type?: string
          cover_path?: string | null
          created_at?: string
          generated_file_path?: string | null
          id?: string
          layout?: Json
          owner_id: string
          scope_id?: string | null
          scope_type?: string
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          book_type?: string
          cover_path?: string | null
          created_at?: string
          generated_file_path?: string | null
          id?: string
          layout?: Json
          owner_id?: string
          scope_id?: string | null
          scope_type?: string
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "books_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          ai_origin: boolean
          created_at: string
          created_by: string
          description: string | null
          duration_days: number
          id: string
          review_state: string
          scope_id: string | null
          scope_type: string
          settings: Json
          status: string
          title: string
        }
        Insert: {
          ai_origin?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          duration_days?: number
          id?: string
          review_state?: string
          scope_id?: string | null
          scope_type: string
          settings?: Json
          status?: string
          title: string
        }
        Update: {
          ai_origin?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          duration_days?: number
          id?: string
          review_state?: string
          scope_id?: string | null
          scope_type?: string
          settings?: Json
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_challenges: {
        Row: {
          circle_id: string
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          id: string
          starts_at: string | null
          status: string
          title: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string
          title: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_challenges_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_contributions: {
        Row: {
          author_id: string
          body: string
          challenge_id: string | null
          circle_id: string
          contribution_type: string
          created_at: string
          id: string
          media_path: string | null
          visibility: string
        }
        Insert: {
          author_id: string
          body: string
          challenge_id?: string | null
          circle_id: string
          contribution_type: string
          created_at?: string
          id?: string
          media_path?: string | null
          visibility?: string
        }
        Update: {
          author_id?: string
          body?: string
          challenge_id?: string | null
          circle_id?: string
          contribution_type?: string
          created_at?: string
          id?: string
          media_path?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_contributions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_contributions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "circle_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_contributions_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_join_requests: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_join_requests_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_join_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          helper_categories: string[]
          joined_at: string | null
          left_at: string | null
          notification_settings: Json
          role: Database["public"]["Enums"]["circle_role"]
          status: string
          user_id: string
        }
        Insert: {
          circle_id: string
          helper_categories?: string[]
          joined_at?: string | null
          left_at?: string | null
          notification_settings?: Json
          role?: Database["public"]["Enums"]["circle_role"]
          status?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          helper_categories?: string[]
          joined_at?: string | null
          left_at?: string | null
          notification_settings?: Json
          role?: Database["public"]["Enums"]["circle_role"]
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          created_at: string
          id: string
          member_limit: number
          name: string
          owner_id: string
          purpose: string
          status: string
          updated_at: string
          visibility: Database["public"]["Enums"]["circle_visibility"]
        }
        Insert: {
          created_at?: string
          id?: string
          member_limit?: number
          name: string
          owner_id: string
          purpose: string
          status?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["circle_visibility"]
        }
        Update: {
          created_at?: string
          id?: string
          member_limit?: number
          name?: string
          owner_id?: string
          purpose?: string
          status?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["circle_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "circles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          moderation_status: string
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          moderation_status?: string
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          moderation_status?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          audience: string
          author_id: string
          body: string
          circle_id: string | null
          created_at: string
          id: string
          media_paths: string[]
          moderation_status: string
          post_type: string
          updated_at: string
        }
        Insert: {
          audience: string
          author_id: string
          body: string
          circle_id?: string | null
          created_at?: string
          id?: string
          media_paths?: string[]
          moderation_status?: string
          post_type: string
          updated_at?: string
        }
        Update: {
          audience?: string
          author_id?: string
          body?: string
          circle_id?: string | null
          created_at?: string
          id?: string
          media_paths?: string[]
          moderation_status?: string
          post_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_saves: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_events: {
        Row: {
          consent_type: string
          created_at: string
          decision: boolean
          id: string
          resource_id: string | null
          resource_type: string | null
          scope_id: string | null
          source: string
          user_id: string
          version: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          decision: boolean
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          scope_id?: string | null
          source?: string
          user_id: string
          version: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          decision?: boolean
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          scope_id?: string | null
          source?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tag_links: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "content_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          taxonomy: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          slug: string
          taxonomy: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          taxonomy?: string
        }
        Relationships: []
      }
      content_versions: {
        Row: {
          author_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          publish_state: string
          reviewer_id: string | null
          snapshot: Json
          version_number: number
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          publish_state?: string
          reviewer_id?: string | null
          snapshot: Json
          version_number: number
        }
        Update: {
          author_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          publish_state?: string
          reviewer_id?: string | null
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_versions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_versions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          alias: string | null
          conversation_id: string
          joined_at: string
          left_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          alias?: string | null
          conversation_id: string
          joined_at?: string
          left_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          alias?: string | null
          conversation_id?: string
          joined_at?: string
          left_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          circle_id: string | null
          conversation_type: string
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          circle_id?: string | null
          conversation_type: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          circle_id?: string | null
          conversation_type?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_answers: {
        Row: {
          answer_body: Json
          author_id: string
          couple_id: string
          id: string
          prompt_key: string
          session_key: string
          share_state: Database["public"]["Enums"]["share_state"]
          submitted_at: string
        }
        Insert: {
          answer_body?: Json
          author_id: string
          couple_id: string
          id?: string
          prompt_key: string
          session_key: string
          share_state?: Database["public"]["Enums"]["share_state"]
          submitted_at?: string
        }
        Update: {
          answer_body?: Json
          author_id?: string
          couple_id?: string
          id?: string
          prompt_key?: string
          session_key?: string
          share_state?: Database["public"]["Enums"]["share_state"]
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_answers_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_game_sessions: {
        Row: {
          couple_id: string
          created_at: string
          game_id: string
          id: string
          session_a_id: string | null
          session_b_id: string | null
          status: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          game_id: string
          id?: string
          session_a_id?: string | null
          session_b_id?: string | null
          status?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          game_id?: string
          id?: string
          session_a_id?: string | null
          session_b_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_game_sessions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_game_sessions_session_a_id_fkey"
            columns: ["session_a_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_game_sessions_session_b_id_fkey"
            columns: ["session_b_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          connected_at: string | null
          created_at: string
          disconnected_at: string | null
          id: string
          status: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: string
          status?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: string
          status?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couples_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      covenants: {
        Row: {
          acknowledged_by_a: boolean
          acknowledged_by_b: boolean
          activated_at: string | null
          body: Json
          couple_id: string
          created_at: string
          id: string
          status: string
          title: string
          version: number
        }
        Insert: {
          acknowledged_by_a?: boolean
          acknowledged_by_b?: boolean
          activated_at?: string | null
          body?: Json
          couple_id: string
          created_at?: string
          id?: string
          status?: string
          title: string
          version?: number
        }
        Update: {
          acknowledged_by_a?: boolean
          acknowledged_by_b?: boolean
          activated_at?: string | null
          body?: Json
          couple_id?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "covenants_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_game_challenges: {
        Row: {
          challenge_date: string
          created_at: string
          game_id: string
          id: string
          scenario_id: string | null
          title: string
          xp_bonus: number
        }
        Insert: {
          challenge_date: string
          created_at?: string
          game_id: string
          id?: string
          scenario_id?: string | null
          title: string
          xp_bonus?: number
        }
        Update: {
          challenge_date?: string
          created_at?: string
          game_id?: string
          id?: string
          scenario_id?: string | null
          title?: string
          xp_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_game_challenges_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_game_challenges_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "game_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          conclusion: string | null
          couple_id: string
          created_at: string
          created_by: string
          emotions_notes: string | null
          facts_notes: string | null
          id: string
          question: string
          review_date: string | null
          risks_notes: string | null
          status: string
          tradeoffs_notes: string | null
          updated_at: string
          values_notes: string | null
        }
        Insert: {
          conclusion?: string | null
          couple_id: string
          created_at?: string
          created_by: string
          emotions_notes?: string | null
          facts_notes?: string | null
          id?: string
          question: string
          review_date?: string | null
          risks_notes?: string | null
          status?: string
          tradeoffs_notes?: string | null
          updated_at?: string
          values_notes?: string | null
        }
        Update: {
          conclusion?: string | null
          couple_id?: string
          created_at?: string
          created_by?: string
          emotions_notes?: string | null
          facts_notes?: string | null
          id?: string
          question?: string
          review_date?: string | null
          risks_notes?: string | null
          status?: string
          tradeoffs_notes?: string | null
          updated_at?: string
          values_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          created_at: string
          description: string | null
          entitlement_key: string
          id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entitlement_key: string
          id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entitlement_key?: string
          id?: string
        }
        Relationships: []
      }
      experiment_assignments: {
        Row: {
          assigned_at: string
          experiment_key: string
          id: string
          user_id: string
          variant: string
        }
        Insert: {
          assigned_at?: string
          experiment_key: string
          id?: string
          user_id: string
          variant: string
        }
        Update: {
          assigned_at?: string
          experiment_key?: string
          id?: string
          user_id?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      filings: {
        Row: {
          accession_or_ref: string
          created_at: string
          explanation: string | null
          filed_at: string | null
          filing_type: string | null
          id: string
          questions: Json
          section: string | null
          security_id: string
          status: string
        }
        Insert: {
          accession_or_ref: string
          created_at?: string
          explanation?: string | null
          filed_at?: string | null
          filing_type?: string | null
          id?: string
          questions?: Json
          section?: string | null
          security_id: string
          status?: string
        }
        Update: {
          accession_or_ref?: string
          created_at?: string
          explanation?: string | null
          filed_at?: string | null
          filing_type?: string | null
          id?: string
          questions?: Json
          section?: string | null
          security_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "filings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      game_badges: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          rule_type: string
          rule_value: number
          slug: string
          xp_bonus: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          rule_type: string
          rule_value?: number
          slug: string
          xp_bonus?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          rule_type?: string
          rule_value?: number
          slug?: string
          xp_bonus?: number
        }
        Relationships: []
      }
      game_choices: {
        Row: {
          choice_label: string
          choice_text: string
          feedback: string | null
          id: string
          is_best: boolean
          scenario_id: string
          score: number
        }
        Insert: {
          choice_label: string
          choice_text: string
          feedback?: string | null
          id?: string
          is_best?: boolean
          scenario_id: string
          score?: number
        }
        Update: {
          choice_label?: string
          choice_text?: string
          feedback?: string | null
          id?: string
          is_best?: boolean
          scenario_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_choices_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "game_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scenarios: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          difficulty: string
          game_id: string
          id: string
          prayer_text: string | null
          scenario_text: string
          title: string
          verse_reference: string | null
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          difficulty?: string
          game_id: string
          id?: string
          prayer_text?: string | null
          scenario_text: string
          title: string
          verse_reference?: string | null
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          difficulty?: string
          game_id?: string
          id?: string
          prayer_text?: string | null
          scenario_text?: string
          title?: string
          verse_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_scenarios_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_session_answers: {
        Row: {
          answered_at: string
          choice_id: string
          id: string
          scenario_id: string
          score_awarded: number
          session_id: string
        }
        Insert: {
          answered_at?: string
          choice_id: string
          id?: string
          scenario_id: string
          score_awarded?: number
          session_id: string
        }
        Update: {
          answered_at?: string
          choice_id?: string
          id?: string
          scenario_id?: string
          score_awarded?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_session_answers_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "game_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_session_answers_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "game_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_session_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          completed_at: string | null
          game_id: string
          id: string
          score: number
          started_at: string
          status: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed_at?: string | null
          game_id: string
          id?: string
          score?: number
          started_at?: string
          status?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          completed_at?: string | null
          game_id?: string
          id?: string
          score?: number
          started_at?: string
          status?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_rounds: number
          min_rounds: number
          name: string
          slug: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_rounds?: number
          min_rounds?: number
          name: string
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_rounds?: number
          min_rounds?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      helper_profiles: {
        Row: {
          approved_at: string | null
          availability_status: string
          categories: string[]
          created_at: string
          status: string
          support_role: Database["public"]["Enums"]["support_role"]
          training_acknowledged_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          availability_status?: string
          categories?: string[]
          created_at?: string
          status?: string
          support_role: Database["public"]["Enums"]["support_role"]
          training_acknowledged_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          availability_status?: string
          categories?: string[]
          created_at?: string
          status?: string
          support_role?: Database["public"]["Enums"]["support_role"]
          training_acknowledged_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "helper_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_theses: {
        Row: {
          created_at: string
          disconfirming_evidence: string | null
          horizon: string | null
          id: string
          risks: string | null
          security_id: string
          status: string
          thesis: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          disconfirming_evidence?: string | null
          horizon?: string | null
          id?: string
          risks?: string | null
          security_id: string
          status?: string
          thesis: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          disconfirming_evidence?: string | null
          horizon?: string | null
          id?: string
          risks?: string | null
          security_id?: string
          status?: string
          thesis?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "investment_theses_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_theses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          expires_at: string
          id: string
          invite_type: Database["public"]["Enums"]["invite_type"]
          inviter_id: string
          revoked_at: string | null
          scope_id: string | null
          status: Database["public"]["Enums"]["invite_status"]
          target_email_hash: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          expires_at: string
          id?: string
          invite_type: Database["public"]["Enums"]["invite_type"]
          inviter_id: string
          revoked_at?: string | null
          scope_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          target_email_hash?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invite_type?: Database["public"]["Enums"]["invite_type"]
          inviter_id?: string
          revoked_at?: string | null
          scope_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          target_email_hash?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_cards: {
        Row: {
          body: string
          card_number: number
          created_at: string
          display_title: string
          id: string
          lesson_id: string
          media: Json
          system_step: string
          takeaway: string | null
          updated_at: string
        }
        Insert: {
          body: string
          card_number: number
          created_at?: string
          display_title: string
          id?: string
          lesson_id: string
          media?: Json
          system_step: string
          takeaway?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          card_number?: number
          created_at?: string
          display_title?: string
          id?: string
          lesson_id?: string
          media?: Json
          system_step?: string
          takeaway?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_cards_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_cards_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_game_choices: {
        Row: {
          choice_index: number
          choice_text: string
          created_at: string
          feedback: string | null
          game_id: string
          id: string
          is_best_choice: boolean
        }
        Insert: {
          choice_index: number
          choice_text: string
          created_at?: string
          feedback?: string | null
          game_id: string
          id?: string
          is_best_choice?: boolean
        }
        Update: {
          choice_index?: number
          choice_text?: string
          created_at?: string
          feedback?: string | null
          game_id?: string
          id?: string
          is_best_choice?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lesson_game_choices_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "lesson_games"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_games: {
        Row: {
          created_at: string
          game_type: string
          id: string
          lesson_id: string
          prompt: string
          reward_xp: number
          scenario_context: string | null
          success_explanation: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_type?: string
          id?: string
          lesson_id: string
          prompt: string
          reward_xp?: number
          scenario_context?: string | null
          success_explanation?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_type?: string
          id?: string
          lesson_id?: string
          prompt?: string
          reward_xp?: number
          scenario_context?: string | null
          success_explanation?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_games_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_games_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data_freshness: {
        Row: {
          detail: Json
          last_sync_at: string
          provider: string
          status: string
        }
        Insert: {
          detail?: Json
          last_sync_at: string
          provider: string
          status?: string
        }
        Update: {
          detail?: Json
          last_sync_at?: string
          provider?: string
          status?: string
        }
        Relationships: []
      }
      market_portfolios: {
        Row: {
          base_currency: string
          created_at: string
          current_cash: number
          id: string
          starting_cash: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          current_cash?: number
          id?: string
          starting_cash?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          current_cash?: number
          id?: string
          starting_cash?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices_daily: {
        Row: {
          adjusted_close: number | null
          close: number | null
          fetched_at: string
          high: number | null
          id: string
          low: number | null
          open: number | null
          price_date: string
          provider: string
          security_id: string
          volume: number | null
        }
        Insert: {
          adjusted_close?: number | null
          close?: number | null
          fetched_at?: string
          high?: number | null
          id?: string
          low?: number | null
          open?: number | null
          price_date: string
          provider: string
          security_id: string
          volume?: number | null
        }
        Update: {
          adjusted_close?: number | null
          close?: number | null
          fetched_at?: string
          high?: number | null
          id?: string
          low?: number | null
          open?: number | null
          price_date?: string
          provider?: string
          security_id?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_prices_daily_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      market_quotes_cache: {
        Row: {
          delay_label: string
          expires_at: string
          last_price: number
          provider: string
          quote_timestamp: string
          security_id: string
          updated_at: string
        }
        Insert: {
          delay_label?: string
          expires_at: string
          last_price: number
          provider: string
          quote_timestamp: string
          security_id: string
          updated_at?: string
        }
        Update: {
          delay_label?: string
          expires_at?: string
          last_price?: number
          provider?: string
          quote_timestamp?: string
          security_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_quotes_cache_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: true
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: Json
          couple_id: string
          created_at: string
          created_by: string
          id: string
          notes: Json
          scheduled_at: string | null
          status: string
          title: string
        }
        Insert: {
          agenda?: Json
          couple_id: string
          created_at?: string
          created_by: string
          id?: string
          notes?: Json
          scheduled_at?: string | null
          status?: string
          title: string
        }
        Update: {
          agenda?: Json
          couple_id?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: Json
          scheduled_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          byte_size: number | null
          created_at: string
          id: string
          message_id: string
          mime_type: string | null
          scan_status: string
          storage_path: string
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          id?: string
          message_id: string
          mime_type?: string | null
          scan_status?: string
          storage_path: string
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          id?: string
          message_id?: string
          mime_type?: string | null
          scan_status?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          moderation_status: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          moderation_status?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          moderation_status?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_proof_submissions: {
        Row: {
          created_at: string
          id: string
          mission_id: string
          note: string | null
          proof_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_id: string
          note?: string | null
          proof_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_id?: string
          note?: string | null
          proof_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_proof_submissions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_proof_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_proof_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          action_text: string
          category: string
          created_at: string
          difficulty: string
          id: string
          proof_types: string[]
          safety_tags: string[]
          slug: string
          status: string
          teaching: string | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          action_text: string
          category: string
          created_at?: string
          difficulty?: string
          id?: string
          proof_types?: string[]
          safety_tags?: string[]
          slug: string
          status?: string
          teaching?: string | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          action_text?: string
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          proof_types?: string[]
          safety_tags?: string[]
          slug?: string
          status?: string
          teaching?: string | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      note_attachments: {
        Row: {
          attachment_type: string
          byte_size: number | null
          checksum: string | null
          consent_version: string | null
          created_at: string
          id: string
          note_id: string
          retention_state: string
          storage_path: string
        }
        Insert: {
          attachment_type: string
          byte_size?: number | null
          checksum?: string | null
          consent_version?: string | null
          created_at?: string
          id?: string
          note_id: string
          retention_state?: string
          storage_path: string
        }
        Update: {
          attachment_type?: string
          byte_size?: number | null
          checksum?: string | null
          consent_version?: string | null
          created_at?: string
          id?: string
          note_id?: string
          retention_state?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_revisions: {
        Row: {
          body: Json
          created_at: string
          created_by: string | null
          id: string
          note_id: string
          revision_type: string
          version_number: number
        }
        Insert: {
          body: Json
          created_at?: string
          created_by?: string | null
          id?: string
          note_id: string
          revision_type?: string
          version_number: number
        }
        Update: {
          body?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          note_id?: string
          revision_type?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "note_revisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_revisions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: Json
          context_id: string | null
          context_type: string | null
          created_at: string
          current_version: number
          id: string
          owner_id: string
          privacy_state: string
          seal_state: Database["public"]["Enums"]["note_seal_state"]
          sealed_milestone: string | null
          sealed_until: string | null
          status: string
          title: string
          unlocked_at: string | null
          updated_at: string
        }
        Insert: {
          body?: Json
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          current_version?: number
          id?: string
          owner_id: string
          privacy_state?: string
          seal_state?: Database["public"]["Enums"]["note_seal_state"]
          sealed_milestone?: string | null
          sealed_until?: string | null
          status?: string
          title?: string
          unlocked_at?: string | null
          updated_at?: string
        }
        Update: {
          body?: Json
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          current_version?: number
          id?: string
          owner_id?: string
          privacy_state?: string
          seal_state?: Database["public"]["Enums"]["note_seal_state"]
          sealed_milestone?: string | null
          sealed_until?: string | null
          status?: string
          title?: string
          unlocked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          error: string | null
          id: string
          provider: string | null
          provider_message_id: string | null
          queue_id: string
          status: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          id?: string
          provider?: string | null
          provider_message_id?: string | null
          queue_id: string
          status: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          id?: string
          provider?: string | null
          provider_message_id?: string | null
          queue_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "notification_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          categories: Json
          email_enabled: boolean
          push_enabled: boolean
          quiet_hours: Json
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json
          email_enabled?: boolean
          push_enabled?: boolean
          quiet_hours?: Json
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json
          email_enabled?: boolean
          push_enabled?: boolean
          quiet_hours?: Json
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          id: string
          payload: Json
          scheduled_for: string
          status: string
          template_key: string
          user_id: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string
          id?: string
          payload?: Json
          scheduled_for?: string
          status?: string
          template_key: string
          user_id: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          id?: string
          payload?: Json
          scheduled_for?: string
          status?: string
          template_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_state: {
        Row: {
          completed_at: string | null
          completed_steps: string[]
          created_at: string
          current_step: string
          skipped_invites: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[]
          created_at?: string
          current_step?: string
          skipped_invites?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[]
          created_at?: string
          current_step?: string
          skipped_invites?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_entitlements: {
        Row: {
          entitlement_key: string
          plan_key: string
        }
        Insert: {
          entitlement_key: string
          plan_key: string
        }
        Update: {
          entitlement_key?: string
          plan_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_entitlements_entitlement_key_fkey"
            columns: ["entitlement_key"]
            isOneToOne: false
            referencedRelation: "entitlements"
            referencedColumns: ["entitlement_key"]
          },
          {
            foreignKeyName: "plan_entitlements_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["plan_key"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          plan_key: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          plan_key: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          plan_key?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_path: string | null
          bio: string | null
          birth_year: number | null
          created_at: string
          deleted_at: string | null
          discoverable: boolean
          display_name: string
          id: string
          locale: string
          onboarding_state: string
          plan_status: string
          timezone: string
          updated_at: string
          visibility: Database["public"]["Enums"]["profile_visibility"]
        }
        Insert: {
          account_status?: string
          avatar_path?: string | null
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          deleted_at?: string | null
          discoverable?: boolean
          display_name: string
          id: string
          locale?: string
          onboarding_state?: string
          plan_status?: string
          timezone?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["profile_visibility"]
        }
        Update: {
          account_status?: string
          avatar_path?: string | null
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          deleted_at?: string | null
          discoverable?: boolean
          display_name?: string
          id?: string
          locale?: string
          onboarding_state?: string
          plan_status?: string
          timezone?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["profile_visibility"]
        }
        Relationships: []
      }
      protocol_days: {
        Row: {
          closing_prayer: string | null
          day_number: number
          id: string
          is_milestone: boolean
          mission_id: string | null
          phase_id: string | null
          prayer: string | null
          protocol_id: string
          reflection_prompt: string | null
          teaching: string | null
          verse_reference: string | null
          verse_text: string | null
        }
        Insert: {
          closing_prayer?: string | null
          day_number: number
          id?: string
          is_milestone?: boolean
          mission_id?: string | null
          phase_id?: string | null
          prayer?: string | null
          protocol_id: string
          reflection_prompt?: string | null
          teaching?: string | null
          verse_reference?: string | null
          verse_text?: string | null
        }
        Update: {
          closing_prayer?: string | null
          day_number?: number
          id?: string
          is_milestone?: boolean
          mission_id?: string | null
          phase_id?: string | null
          prayer?: string | null
          protocol_id?: string
          reflection_prompt?: string | null
          teaching?: string | null
          verse_reference?: string | null
          verse_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocol_days_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_days_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "protocol_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_days_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_phases: {
        Row: {
          description: string | null
          id: string
          phase_number: number
          protocol_id: string
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          phase_number: number
          protocol_id: string
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          phase_number?: number
          protocol_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_phases_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocols: {
        Row: {
          audience: string
          created_at: string
          duration_days: number
          id: string
          outcome_type: string | null
          promise_text: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          audience?: string
          created_at?: string
          duration_days: number
          id?: string
          outcome_type?: string | null
          promise_text?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          audience?: string
          created_at?: string
          duration_days?: number
          id?: string
          outcome_type?: string | null
          promise_text?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      quiz_options: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          is_correct: boolean
          option_index: number
          option_text: string
          question_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          option_index: number
          option_text: string
          question_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          option_index?: number
          option_text?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          difficulty: string
          explanation: string
          id: string
          lesson_id: string
          points: number
          question_number: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          explanation: string
          id?: string
          lesson_id: string
          points?: number
          question_number: number
          question_text: string
          question_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          lesson_id?: string
          points?: number
          question_number?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          recipient_id: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          requester_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          recipient_id: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          requester_id: string
          status: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          recipient_id?: string
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          input_snapshot: Json
          output_path: string | null
          owner_id: string
          period_end: string | null
          period_start: string | null
          report_type: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_snapshot?: Json
          output_path?: string | null
          owner_id: string
          period_end?: string | null
          period_start?: string | null
          report_type: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_snapshot?: Json
          output_path?: string | null
          owner_id?: string
          period_end?: string | null
          period_start?: string | null
          report_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_jobs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reveal_states: {
        Row: {
          couple_id: string
          id: string
          ready: boolean
          revealed_at: string | null
          session_key: string
          user_id: string
        }
        Insert: {
          couple_id: string
          id?: string
          ready?: boolean
          revealed_at?: string | null
          session_key: string
          user_id: string
        }
        Update: {
          couple_id?: string
          id?: string
          ready?: boolean
          revealed_at?: string | null
          session_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reveal_states_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reveal_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_reports: {
        Row: {
          created_at: string
          details: string | null
          evidence_paths: string[]
          id: string
          reason_code: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          evidence_paths?: string[]
          id?: string
          reason_code: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          evidence_paths?: string[]
          id?: string
          reason_code?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      securities: {
        Row: {
          created_at: string
          currency: string
          exchange: string | null
          id: string
          is_active: boolean
          name: string
          provider_identifiers: Json
          sector: string | null
          security_type: string
          ticker: string
        }
        Insert: {
          created_at?: string
          currency?: string
          exchange?: string | null
          id?: string
          is_active?: boolean
          name: string
          provider_identifiers?: Json
          sector?: string | null
          security_type?: string
          ticker: string
        }
        Update: {
          created_at?: string
          currency?: string
          exchange?: string | null
          id?: string
          is_active?: boolean
          name?: string
          provider_identifiers?: Json
          sector?: string | null
          security_type?: string
          ticker?: string
        }
        Relationships: []
      }
      shared_inbox_items: {
        Row: {
          author_id: string
          body: string
          circle_id: string
          created_at: string
          id: string
          item_type: string
          status: string
        }
        Insert: {
          author_id: string
          body: string
          circle_id: string
          created_at?: string
          id?: string
          item_type: string
          status?: string
        }
        Update: {
          author_id?: string
          body?: string
          circle_id?: string
          created_at?: string
          id?: string
          item_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_inbox_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_inbox_items_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_seats: {
        Row: {
          created_at: string
          id: string
          seat_role: string
          subscription_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          seat_role?: string
          subscription_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          seat_role?: string
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_seats_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_seats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          customer_id: string
          household_or_circle_scope: string | null
          id: string
          plan_key: string
          provider_subscription_id: string
          scope_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_provider?: Database["public"]["Enums"]["billing_provider"]
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          customer_id: string
          household_or_circle_scope?: string | null
          id?: string
          plan_key: string
          provider_subscription_id: string
          scope_id?: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_provider?: Database["public"]["Enums"]["billing_provider"]
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          customer_id?: string
          household_or_circle_scope?: string | null
          id?: string
          plan_key?: string
          provider_subscription_id?: string
          scope_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["plan_key"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_feedback: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number | null
          support_request_id: string
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          support_request_id: string
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          support_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_feedback_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_feedback_support_request_id_fkey"
            columns: ["support_request_id"]
            isOneToOne: false
            referencedRelation: "support_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      support_matches: {
        Row: {
          closed_at: string | null
          conversation_id: string
          helper_id: string
          id: string
          matched_at: string
          status: string
          support_request_id: string
        }
        Insert: {
          closed_at?: string | null
          conversation_id: string
          helper_id: string
          id?: string
          matched_at?: string
          status?: string
          support_request_id: string
        }
        Update: {
          closed_at?: string | null
          conversation_id?: string
          helper_id?: string
          id?: string
          matched_at?: string
          status?: string
          support_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_matches_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_matches_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_matches_support_request_id_fkey"
            columns: ["support_request_id"]
            isOneToOne: true
            referencedRelation: "support_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      support_requests: {
        Row: {
          anonymous_alias: string | null
          category: string
          closed_at: string | null
          conversation_id: string | null
          created_at: string
          id: string
          language_code: string
          matched_helper_id: string | null
          requested_role: Database["public"]["Enums"]["support_role"]
          requester_id: string
          routed_at: string | null
          status: Database["public"]["Enums"]["support_status"]
          urgency: string
        }
        Insert: {
          anonymous_alias?: string | null
          category: string
          closed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          language_code?: string
          matched_helper_id?: string | null
          requested_role: Database["public"]["Enums"]["support_role"]
          requester_id: string
          routed_at?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          urgency?: string
        }
        Update: {
          anonymous_alias?: string | null
          category?: string
          closed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          language_code?: string
          matched_helper_id?: string | null
          requested_role?: Database["public"]["Enums"]["support_role"]
          requester_id?: string
          routed_at?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_matched_helper_id_fkey"
            columns: ["matched_helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          evidence_ref: string | null
          id: string
          progress: Json
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          evidence_ref?: string | null
          id?: string
          progress?: Json
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          evidence_ref?: string | null
          id?: string
          progress?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entitlements: {
        Row: {
          active: boolean
          created_at: string
          ends_at: string | null
          entitlement_key: string
          id: string
          source_subscription_id: string | null
          starts_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_at?: string | null
          entitlement_key: string
          id?: string
          source_subscription_id?: string | null
          starts_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_at?: string | null
          entitlement_key?: string
          id?: string
          source_subscription_id?: string | null
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entitlements_entitlement_key_fkey"
            columns: ["entitlement_key"]
            isOneToOne: false
            referencedRelation: "entitlements"
            referencedColumns: ["entitlement_key"]
          },
          {
            foreignKeyName: "user_entitlements_source_subscription_id_fkey"
            columns: ["source_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_game_attempts: {
        Row: {
          created_at: string
          game_id: string
          id: string
          lesson_id: string
          result: Json
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          lesson_id: string
          result?: Json
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          lesson_id?: string
          result?: Json
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_game_attempts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "lesson_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_game_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_game_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_game_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_game_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "game_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_game_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          cards_completed_count: number
          closing_prayer_completed: boolean
          closing_verse_viewed: boolean
          completed_at: string | null
          game_completed: boolean
          id: string
          last_card_number: number | null
          lesson_id: string
          opening_verse_viewed: boolean
          prayer_completed: boolean
          quiz_completed: boolean
          quiz_score: number | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          cards_completed_count?: number
          closing_prayer_completed?: boolean
          closing_verse_viewed?: boolean
          completed_at?: string | null
          game_completed?: boolean
          id?: string
          last_card_number?: number | null
          lesson_id: string
          opening_verse_viewed?: boolean
          prayer_completed?: boolean
          quiz_completed?: boolean
          quiz_score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          cards_completed_count?: number
          closing_prayer_completed?: boolean
          closing_verse_viewed?: boolean
          completed_at?: string | null
          game_completed?: boolean
          id?: string
          last_card_number?: number | null
          lesson_id?: string
          opening_verse_viewed?: boolean
          prayer_completed?: boolean
          quiz_completed?: boolean
          quiz_score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          difficulty: string | null
          due_date: string | null
          id: string
          mission_id: string
          source_id: string | null
          source_type: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          difficulty?: string | null
          due_date?: string | null
          id?: string
          mission_id: string
          source_id?: string | null
          source_type?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          difficulty?: string | null
          due_date?: string | null
          id?: string
          mission_id?: string
          source_id?: string | null
          source_type?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          accessibility: Json
          content_interests: string[]
          created_at: string
          lesson_reminders: boolean
          prayer_reminders: boolean
          privacy_defaults: Json
          reflection_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility?: Json
          content_interests?: string[]
          created_at?: string
          lesson_reminders?: boolean
          prayer_reminders?: boolean
          privacy_defaults?: Json
          reflection_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility?: Json
          content_interests?: string[]
          created_at?: string
          lesson_reminders?: boolean
          prayer_reminders?: boolean
          privacy_defaults?: Json
          reflection_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_protocols: {
        Row: {
          completed_at: string | null
          current_day: number
          id: string
          privacy: string
          protocol_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_day?: number
          id?: string
          privacy?: string
          protocol_id: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_day?: number
          id?: string
          privacy?: string
          protocol_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_protocols_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_protocols_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          answers: Json
          attempt_number: number
          correct_count: number
          created_at: string
          id: string
          lesson_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json
          attempt_number?: number
          correct_count: number
          created_at?: string
          id?: string
          lesson_id: string
          score: number
          total_questions?: number
          user_id: string
        }
        Update: {
          answers?: Json
          attempt_number?: number
          correct_count?: number
          created_at?: string
          id?: string
          lesson_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          scope_id: string | null
          scope_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["staff_role"]
          scope_id?: string | null
          scope_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          scope_id?: string | null
          scope_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number
          grace_credits: number
          last_completed_on: string | null
          longest_streak: number
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          grace_credits?: number
          last_completed_on?: string | null
          longest_streak?: number
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          grace_credits?: number
          last_completed_on?: string | null
          longest_streak?: number
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          idempotency_key: string | null
          lesson_id: string | null
          points: number
          reason: string | null
          source_id: string | null
          source_type: string | null
          user_id: string
          xp_amount: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          idempotency_key?: string | null
          lesson_id?: string | null
          points: number
          reason?: string | null
          source_id?: string | null
          source_type?: string | null
          user_id: string
          xp_amount?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string | null
          lesson_id?: string | null
          points?: number
          reason?: string | null
          source_id?: string | null
          source_type?: string | null
          user_id?: string
          xp_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_xp_events_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_xp_events_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_orders: {
        Row: {
          execution_price: number | null
          id: string
          portfolio_id: string
          quantity: number
          reject_reason: string | null
          requested_at: string
          security_id: string
          side: string
          status: string
          thesis_id: string | null
          user_id: string
        }
        Insert: {
          execution_price?: number | null
          id?: string
          portfolio_id: string
          quantity: number
          reject_reason?: string | null
          requested_at?: string
          security_id: string
          side: string
          status?: string
          thesis_id?: string | null
          user_id: string
        }
        Update: {
          execution_price?: number | null
          id?: string
          portfolio_id?: string
          quantity?: number
          reject_reason?: string | null
          requested_at?: string
          security_id?: string
          side?: string
          status?: string
          thesis_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_orders_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "market_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_orders_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_orders_thesis_id_fkey"
            columns: ["thesis_id"]
            isOneToOne: false
            referencedRelation: "investment_theses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_positions: {
        Row: {
          average_cost: number
          id: string
          portfolio_id: string
          quantity: number
          realized_pnl: number
          security_id: string
          unrealized_pnl: number
        }
        Insert: {
          average_cost: number
          id?: string
          portfolio_id: string
          quantity: number
          realized_pnl?: number
          security_id: string
          unrealized_pnl?: number
        }
        Update: {
          average_cost?: number
          id?: string
          portfolio_id?: string
          quantity?: number
          realized_pnl?: number
          security_id?: string
          unrealized_pnl?: number
        }
        Relationships: [
          {
            foreignKeyName: "virtual_positions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "market_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_positions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      content_modules: {
        Row: {
          created_at: string | null
          day_end: number | null
          day_start: number | null
          description: string | null
          id: string | null
          level_name: string | null
          module_number: number | null
          slug: string | null
          status: string | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          day_end?: number | null
          day_start?: number | null
          description?: string | null
          id?: string | null
          level_name?: string | null
          module_number?: number | null
          slug?: string | null
          status?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          day_end?: number | null
          day_start?: number | null
          description?: string | null
          id?: string | null
          level_name?: string | null
          module_number?: number | null
          slug?: string | null
          status?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          audience: string | null
          closing_bible_reference: string | null
          closing_bible_text: string | null
          closing_bible_translation: string | null
          closing_prayer: string | null
          content_version: number | null
          couples_prompt: string | null
          created_at: string | null
          day_number: number | null
          devotional: string | null
          disclaimer_type: string | null
          estimated_minutes: number | null
          id: string | null
          individual_prompt: string | null
          is_premium: boolean | null
          metadata: Json | null
          module_id: string | null
          opening_bible_reference: string | null
          opening_bible_text: string | null
          opening_bible_translation: string | null
          opening_prayer: string | null
          published_at: string | null
          slug: string | null
          status: string | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          audience?: string | null
          closing_bible_reference?: string | null
          closing_bible_text?: string | null
          closing_bible_translation?: string | null
          closing_prayer?: string | null
          content_version?: number | null
          couples_prompt?: string | null
          created_at?: string | null
          day_number?: number | null
          devotional?: string | null
          disclaimer_type?: string | null
          estimated_minutes?: number | null
          id?: string | null
          individual_prompt?: string | null
          is_premium?: boolean | null
          metadata?: Json | null
          module_id?: string | null
          opening_bible_reference?: string | null
          opening_bible_text?: string | null
          opening_bible_translation?: string | null
          opening_prayer?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          audience?: string | null
          closing_bible_reference?: string | null
          closing_bible_text?: string | null
          closing_bible_translation?: string | null
          closing_prayer?: string | null
          content_version?: number | null
          couples_prompt?: string | null
          created_at?: string | null
          day_number?: number | null
          devotional?: string | null
          disclaimer_type?: string | null
          estimated_minutes?: number | null
          id?: string | null
          individual_prompt?: string | null
          is_premium?: boolean | null
          metadata?: Json | null
          module_id?: string | null
          opening_bible_reference?: string | null
          opening_bible_text?: string | null
          opening_bible_translation?: string | null
          opening_prayer?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "content_modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_xp: {
        Args: {
          p_event_type: string
          p_idempotency_key: string
          p_lesson_id?: string
          p_points: number
          p_reason?: string
          p_source_id?: string
          p_source_type?: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          idempotency_key: string | null
          lesson_id: string | null
          points: number
          reason: string | null
          source_id: string | null
          source_type: string | null
          user_id: string
          xp_amount: number | null
        }
        SetofOptions: {
          from: "*"
          to: "user_xp_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_lesson: {
        Args: { p_lesson_id: string }
        Returns: {
          cards_completed_count: number
          closing_prayer_completed: boolean
          closing_verse_viewed: boolean
          completed_at: string | null
          game_completed: boolean
          id: string
          last_card_number: number | null
          lesson_id: string
          opening_verse_viewed: boolean
          prayer_completed: boolean
          quiz_completed: boolean
          quiz_score: number | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        SetofOptions: {
          from: "*"
          to: "user_lesson_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      execute_virtual_order: {
        Args: {
          p_portfolio_id: string
          p_quantity: number
          p_security_id: string
          p_side: string
        }
        Returns: {
          execution_price: number | null
          id: string
          portfolio_id: string
          quantity: number
          reject_reason: string | null
          requested_at: string
          security_id: string
          side: string
          status: string
          thesis_id: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "virtual_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_report_job: {
        Args: {
          p_period_end?: string
          p_period_start?: string
          p_report_type: string
        }
        Returns: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          input_snapshot: Json
          output_path: string | null
          owner_id: string
          period_end: string | null
          period_start: string | null
          report_type: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "report_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      market_data_sync: {
        Args: { p_provider: string; p_rows: Json }
        Returns: Json
      }
      retention_cleanup: { Args: never; Returns: Json }
      route_help_request: {
        Args: { p_request_id: string }
        Returns: {
          closed_at: string | null
          conversation_id: string
          helper_id: string
          id: string
          matched_at: string
          status: string
          support_request_id: string
        }
        SetofOptions: {
          from: "*"
          to: "support_matches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      seal_note: {
        Args: {
          p_milestone?: string
          p_note_id: string
          p_sealed_until?: string
        }
        Returns: {
          body: Json
          context_id: string | null
          context_type: string | null
          created_at: string
          current_version: number
          id: string
          owner_id: string
          privacy_state: string
          seal_state: Database["public"]["Enums"]["note_seal_state"]
          sealed_milestone: string | null
          sealed_until: string | null
          status: string
          title: string
          unlocked_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "notes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      billing_provider: "stripe" | "manual" | "other"
      circle_role: "owner" | "leader" | "member" | "helper" | "read_only"
      circle_visibility: "private" | "discoverable"
      invite_status:
        | "pending"
        | "opened"
        | "accepted"
        | "declined"
        | "expired"
        | "revoked"
      invite_type:
        | "partner"
        | "person"
        | "circle"
        | "challenge"
        | "event"
        | "helper"
      note_seal_state:
        | "draft"
        | "submitted"
        | "sealed"
        | "unlocked"
        | "archived"
      profile_visibility: "public" | "community" | "connections" | "private"
      relationship_type:
        | "partner"
        | "friend"
        | "family"
        | "business"
        | "accountability"
        | "follow"
      share_state:
        | "private"
        | "ready_to_reveal"
        | "revealed"
        | "shared"
        | "excluded"
      staff_role:
        | "content_staff"
        | "safety_staff"
        | "credential_staff"
        | "billing_staff"
        | "admin"
        | "moderator"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
      support_role:
        | "support_friend"
        | "verified_professional"
        | "pastor"
        | "financial_mentor"
      support_status:
        | "draft"
        | "queued"
        | "matched"
        | "active"
        | "closed"
        | "cancelled"
        | "escalated"
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
      billing_provider: ["stripe", "manual", "other"],
      circle_role: ["owner", "leader", "member", "helper", "read_only"],
      circle_visibility: ["private", "discoverable"],
      invite_status: [
        "pending",
        "opened",
        "accepted",
        "declined",
        "expired",
        "revoked",
      ],
      invite_type: [
        "partner",
        "person",
        "circle",
        "challenge",
        "event",
        "helper",
      ],
      note_seal_state: ["draft", "submitted", "sealed", "unlocked", "archived"],
      profile_visibility: ["public", "community", "connections", "private"],
      relationship_type: [
        "partner",
        "friend",
        "family",
        "business",
        "accountability",
        "follow",
      ],
      share_state: [
        "private",
        "ready_to_reveal",
        "revealed",
        "shared",
        "excluded",
      ],
      staff_role: [
        "content_staff",
        "safety_staff",
        "credential_staff",
        "billing_staff",
        "admin",
        "moderator",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "paused",
      ],
      support_role: [
        "support_friend",
        "verified_professional",
        "pastor",
        "financial_mentor",
      ],
      support_status: [
        "draft",
        "queued",
        "matched",
        "active",
        "closed",
        "cancelled",
        "escalated",
      ],
    },
  },
} as const
