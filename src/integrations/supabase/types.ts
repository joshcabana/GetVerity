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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appeals: {
        Row: {
          admin_response: string | null
          created_at: string
          explanation: string
          flag_id: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["appeal_status"] | null
          user_id: string
          voice_note_url: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          explanation: string
          flag_id?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["appeal_status"] | null
          user_id: string
          voice_note_url?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          explanation?: string
          flag_id?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["appeal_status"] | null
          user_id?: string
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appeals_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "moderation_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          agora_channel: string | null
          callee_decision: Database["public"]["Enums"]["spark_decision"] | null
          callee_id: string
          caller_decision: Database["public"]["Enums"]["spark_decision"] | null
          caller_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          is_mutual_spark: boolean | null
          room_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["call_status"] | null
        }
        Insert: {
          agora_channel?: string | null
          callee_decision?: Database["public"]["Enums"]["spark_decision"] | null
          callee_id: string
          caller_decision?: Database["public"]["Enums"]["spark_decision"] | null
          caller_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_mutual_spark?: boolean | null
          room_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"] | null
        }
        Update: {
          agora_channel?: string | null
          callee_decision?: Database["public"]["Enums"]["spark_decision"] | null
          callee_id?: string
          caller_decision?: Database["public"]["Enums"]["spark_decision"] | null
          caller_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_mutual_spark?: boolean | null
          room_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_rsvps: {
        Row: {
          checked_in: boolean
          drop_id: string
          friend_invite_code: string | null
          id: string
          rsvp_at: string
          user_id: string
        }
        Insert: {
          checked_in?: boolean
          drop_id: string
          friend_invite_code?: string | null
          id?: string
          rsvp_at?: string
          user_id: string
        }
        Update: {
          checked_in?: boolean
          drop_id?: string
          friend_invite_code?: string | null
          id?: string
          rsvp_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_rsvps_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
        ]
      }
      drops: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_friendfluence: boolean
          max_capacity: number
          region: string
          room_id: string
          scheduled_at: string
          status: string
          timezone: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_friendfluence?: boolean
          max_capacity?: number
          region?: string
          room_id: string
          scheduled_at: string
          status?: string
          timezone?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_friendfluence?: boolean
          max_capacity?: number
          region?: string
          room_id?: string
          scheduled_at?: string
          status?: string
          timezone?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "drops_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          call_id: string | null
          drop_id: string | null
          id: string
          joined_at: string
          matched_at: string | null
          room_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          call_id?: string | null
          drop_id?: string | null
          id?: string
          joined_at?: string
          matched_at?: string | null
          room_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          call_id?: string | null
          drop_id?: string | null
          id?: string
          joined_at?: string
          matched_at?: string | null
          room_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchmaking_queue_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchmaking_queue_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_read: boolean | null
          is_voice: boolean | null
          sender_id: string
          spark_id: string
          voice_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_voice?: boolean | null
          sender_id: string
          spark_id: string
          voice_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_voice?: boolean | null
          sender_id?: string
          spark_id?: string
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_spark_id_fkey"
            columns: ["spark_id"]
            isOneToOne: false
            referencedRelation: "sparks"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_events: {
        Row: {
          action_taken: string | null
          call_id: string | null
          created_at: string
          details: Json | null
          id: string
          risk_score: number | null
        }
        Insert: {
          action_taken?: string | null
          call_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          risk_score?: number | null
        }
        Update: {
          action_taken?: string | null
          call_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          risk_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_events_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_flags: {
        Row: {
          action_taken: Database["public"]["Enums"]["moderation_action"] | null
          ai_confidence: number | null
          call_id: string | null
          clip_url: string | null
          created_at: string
          flagged_user_id: string
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          action_taken?: Database["public"]["Enums"]["moderation_action"] | null
          ai_confidence?: number | null
          call_id?: string | null
          clip_url?: string | null
          created_at?: string
          flagged_user_id: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          action_taken?: Database["public"]["Enums"]["moderation_action"] | null
          ai_confidence?: number | null
          call_id?: string | null
          clip_url?: string | null
          created_at?: string
          flagged_user_id?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_flags_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_stats: {
        Row: {
          active_users: number | null
          ai_accuracy: number | null
          appeals_total: number | null
          appeals_upheld: number | null
          created_at: string
          gender_balance: Json | null
          id: string
          moderation_flags_count: number | null
          stat_date: string
          total_calls: number | null
          total_sparks: number | null
        }
        Insert: {
          active_users?: number | null
          ai_accuracy?: number | null
          appeals_total?: number | null
          appeals_upheld?: number | null
          created_at?: string
          gender_balance?: Json | null
          id?: string
          moderation_flags_count?: number | null
          stat_date?: string
          total_calls?: number | null
          total_sparks?: number | null
        }
        Update: {
          active_users?: number | null
          ai_accuracy?: number | null
          appeals_total?: number | null
          appeals_upheld?: number | null
          created_at?: string
          gender_balance?: Json | null
          id?: string
          moderation_flags_count?: number | null
          stat_date?: string
          total_calls?: number | null
          total_sparks?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          handle: string | null
          id: string
          is_active: boolean | null
          stripe_customer_id: string | null
          subscription_expires_at: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          token_balance: number
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          handle?: string | null
          id?: string
          is_active?: boolean | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          token_balance?: number
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          handle?: string | null
          id?: string
          is_active?: boolean | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          token_balance?: number
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          buffer_url: string | null
          call_id: string | null
          created_at: string
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          buffer_url?: string | null
          call_id?: string | null
          created_at?: string
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          buffer_url?: string | null
          call_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          active_users: number | null
          category: string | null
          created_at: string
          description: string | null
          gender_balance: Json | null
          icon: string | null
          id: string
          is_premium: boolean | null
          name: string
        }
        Insert: {
          active_users?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          gender_balance?: Json | null
          icon?: string | null
          id?: string
          is_premium?: boolean | null
          name: string
        }
        Update: {
          active_users?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          gender_balance?: Json | null
          icon?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
        }
        Relationships: []
      }
      runtime_alert_events: {
        Row: {
          created_at: string
          id: string
          level: string | null
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string | null
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string | null
          message?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      sparks: {
        Row: {
          ai_insight: string | null
          call_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_archived: boolean | null
          user_a: string
          user_b: string
          voice_intro_a: string | null
          voice_intro_b: string | null
        }
        Insert: {
          ai_insight?: string | null
          call_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          user_a: string
          user_b: string
          voice_intro_a?: string | null
          voice_intro_b?: string | null
        }
        Update: {
          ai_insight?: string | null
          call_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          user_a?: string
          user_b?: string
          voice_intro_a?: string | null
          voice_intro_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sparks_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_processed_events: {
        Row: {
          event_id: string
          processed_at: string
        }
        Insert: {
          event_id: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_trust: {
        Row: {
          created_at: string
          dob: string | null
          id: string
          onboarding_complete: boolean
          onboarding_step: number
          phone_verified: boolean
          preferences: Json | null
          safety_pledge_accepted: boolean
          selfie_verified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dob?: string | null
          id?: string
          onboarding_complete?: boolean
          onboarding_step?: number
          phone_verified?: boolean
          preferences?: Json | null
          safety_pledge_accepted?: boolean
          selfie_verified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dob?: string | null
          id?: string
          onboarding_complete?: boolean
          onboarding_step?: number
          phone_verified?: boolean
          preferences?: Json | null
          safety_pledge_accepted?: boolean
          selfie_verified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_drop_rsvp_count: { Args: { _drop_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_spark_member: {
        Args: { _spark_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      appeal_status: "pending" | "upheld" | "denied"
      call_status: "waiting" | "active" | "completed" | "cancelled"
      moderation_action: "ban" | "warn" | "clear"
      spark_decision: "spark" | "pass"
      subscription_tier: "free" | "pass_monthly" | "pass_annual"
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
      app_role: ["admin", "moderator", "user"],
      appeal_status: ["pending", "upheld", "denied"],
      call_status: ["waiting", "active", "completed", "cancelled"],
      moderation_action: ["ban", "warn", "clear"],
      spark_decision: ["spark", "pass"],
      subscription_tier: ["free", "pass_monthly", "pass_annual"],
    },
  },
} as const
