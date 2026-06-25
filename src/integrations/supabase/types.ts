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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      athlete_transfers: {
        Row: {
          approved_by: string | null
          athlete_id: string
          created_at: string
          from_division: string | null
          from_team_id: string | null
          id: string
          reason: string | null
          status: string | null
          to_division: string | null
          to_team_id: string | null
          transfer_date: string | null
        }
        Insert: {
          approved_by?: string | null
          athlete_id: string
          created_at?: string
          from_division?: string | null
          from_team_id?: string | null
          id?: string
          reason?: string | null
          status?: string | null
          to_division?: string | null
          to_team_id?: string | null
          transfer_date?: string | null
        }
        Update: {
          approved_by?: string | null
          athlete_id?: string
          created_at?: string
          from_division?: string | null
          from_team_id?: string | null
          id?: string
          reason?: string | null
          status?: string | null
          to_division?: string | null
          to_team_id?: string | null
          transfer_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_transfers_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_transfers_from_team_id_fkey"
            columns: ["from_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_transfers_to_team_id_fkey"
            columns: ["to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          club_name: string | null
          created_at: string
          date_of_birth: string | null
          disciplines: string[]
          display_name: string | null
          external_student_id: string | null
          first_name: string
          gender: string | null
          house: string | null
          id: string
          id_card_number: string | null
          is_active: boolean | null
          is_ss_linked: boolean
          is_suspended: boolean | null
          jersey_number: number | null
          last_name: string
          medical_waiver_date: string | null
          medical_waiver_signed: boolean | null
          nexus_sport: string | null
          nfc_tag: string | null
          personal_bests: Json | null
          photo_url: string | null
          province: string
          qr_code: string | null
          scholastic_card_verified: boolean
          school_name: string | null
          ss_school_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          club_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          disciplines: string[]
          display_name?: string | null
          external_student_id?: string | null
          first_name: string
          gender?: string | null
          house?: string | null
          id?: string
          id_card_number?: string | null
          is_active?: boolean | null
          is_ss_linked?: boolean
          is_suspended?: boolean | null
          jersey_number?: number | null
          last_name: string
          medical_waiver_date?: string | null
          medical_waiver_signed?: boolean | null
          nexus_sport?: string | null
          nfc_tag?: string | null
          personal_bests?: Json | null
          photo_url?: string | null
          province: string
          qr_code?: string | null
          scholastic_card_verified?: boolean
          school_name?: string | null
          ss_school_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          club_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          disciplines?: string[]
          display_name?: string | null
          external_student_id?: string | null
          first_name?: string
          gender?: string | null
          house?: string | null
          id?: string
          id_card_number?: string | null
          is_active?: boolean | null
          is_ss_linked?: boolean
          is_suspended?: boolean | null
          jersey_number?: number | null
          last_name?: string
          medical_waiver_date?: string | null
          medical_waiver_signed?: boolean | null
          nexus_sport?: string | null
          nfc_tag?: string | null
          personal_bests?: Json | null
          photo_url?: string | null
          province?: string
          qr_code?: string | null
          scholastic_card_verified?: boolean
          school_name?: string | null
          ss_school_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          commentary_enabled: boolean | null
          competition_id: string | null
          created_at: string
          created_by: string | null
          ended_at: string | null
          fixture_id: string | null
          graphics_data: Json | null
          id: string
          is_live: boolean | null
          platform: string | null
          quality: string | null
          started_at: string | null
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          viewer_count: number | null
        }
        Insert: {
          commentary_enabled?: boolean | null
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          fixture_id?: string | null
          graphics_data?: Json | null
          id?: string
          is_live?: boolean | null
          platform?: string | null
          quality?: string | null
          started_at?: string | null
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          viewer_count?: number | null
        }
        Update: {
          commentary_enabled?: boolean | null
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          fixture_id?: string | null
          graphics_data?: Json | null
          id?: string
          is_live?: boolean | null
          platform?: string | null
          quality?: string | null
          started_at?: string | null
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcasts_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          age_group: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discipline: string
          end_date: string | null
          entry_fee: number | null
          format: Database["public"]["Enums"]["bracket_format"]
          id: string
          is_broadcast: boolean | null
          is_house_competition: boolean | null
          is_sports_day: boolean | null
          level: Database["public"]["Enums"]["competition_level"]
          logo_url: string | null
          max_participants: number | null
          name: string
          parent_id: string | null
          prize_pool: number | null
          province: string | null
          registration_deadline: string | null
          rules: Json | null
          season: string | null
          slug: string | null
          sponsor: string | null
          stage: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["competition_status"]
          term: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discipline: string
          end_date?: string | null
          entry_fee?: number | null
          format?: Database["public"]["Enums"]["bracket_format"]
          id?: string
          is_broadcast?: boolean | null
          is_house_competition?: boolean | null
          is_sports_day?: boolean | null
          level: Database["public"]["Enums"]["competition_level"]
          logo_url?: string | null
          max_participants?: number | null
          name: string
          parent_id?: string | null
          prize_pool?: number | null
          province?: string | null
          registration_deadline?: string | null
          rules?: Json | null
          season?: string | null
          slug?: string | null
          sponsor?: string | null
          stage?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          term?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          age_group?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discipline?: string
          end_date?: string | null
          entry_fee?: number | null
          format?: Database["public"]["Enums"]["bracket_format"]
          id?: string
          is_broadcast?: boolean | null
          is_house_competition?: boolean | null
          is_sports_day?: boolean | null
          level?: Database["public"]["Enums"]["competition_level"]
          logo_url?: string | null
          max_participants?: number | null
          name?: string
          parent_id?: string | null
          prize_pool?: number | null
          province?: string | null
          registration_deadline?: string | null
          rules?: Json | null
          season?: string | null
          slug?: string | null
          sponsor?: string | null
          stage?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          term?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_records: {
        Row: {
          appeal_status: string | null
          athlete_id: string | null
          competition_id: string | null
          created_at: string
          description: string | null
          fixture_id: string | null
          id: string
          is_active: boolean | null
          issued_by: string | null
          official_id: string | null
          reason: string
          severity: Database["public"]["Enums"]["disciplinary_severity"]
          suspension_games: number | null
          suspension_until: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          appeal_status?: string | null
          athlete_id?: string | null
          competition_id?: string | null
          created_at?: string
          description?: string | null
          fixture_id?: string | null
          id?: string
          is_active?: boolean | null
          issued_by?: string | null
          official_id?: string | null
          reason: string
          severity: Database["public"]["Enums"]["disciplinary_severity"]
          suspension_games?: number | null
          suspension_until?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          appeal_status?: string | null
          athlete_id?: string | null
          competition_id?: string | null
          created_at?: string
          description?: string | null
          fixture_id?: string | null
          id?: string
          is_active?: boolean | null
          issued_by?: string | null
          official_id?: string | null
          reason?: string
          severity?: Database["public"]["Enums"]["disciplinary_severity"]
          suspension_games?: number | null
          suspension_until?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_records_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_records_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_records_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_records_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          away_athlete_id: string | null
          away_school_team_id: string | null
          away_score: number | null
          away_team_id: string | null
          broadcast_url: string | null
          competition_id: string
          created_at: string
          ended_at: string | null
          extra_time_score: Json | null
          home_athlete_id: string | null
          home_school_team_id: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          is_broadcast: boolean | null
          match_data: Json | null
          penalties_score: Json | null
          period_scores: Json | null
          referee_id: string | null
          round_label: string | null
          round_number: number | null
          scheduled_at: string | null
          scorer_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
          venue_id: string | null
          winner_id: string | null
        }
        Insert: {
          away_athlete_id?: string | null
          away_school_team_id?: string | null
          away_score?: number | null
          away_team_id?: string | null
          broadcast_url?: string | null
          competition_id: string
          created_at?: string
          ended_at?: string | null
          extra_time_score?: Json | null
          home_athlete_id?: string | null
          home_school_team_id?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          is_broadcast?: boolean | null
          match_data?: Json | null
          penalties_score?: Json | null
          period_scores?: Json | null
          referee_id?: string | null
          round_label?: string | null
          round_number?: number | null
          scheduled_at?: string | null
          scorer_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          venue_id?: string | null
          winner_id?: string | null
        }
        Update: {
          away_athlete_id?: string | null
          away_school_team_id?: string | null
          away_score?: number | null
          away_team_id?: string | null
          broadcast_url?: string | null
          competition_id?: string
          created_at?: string
          ended_at?: string | null
          extra_time_score?: Json | null
          home_athlete_id?: string | null
          home_school_team_id?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          is_broadcast?: boolean | null
          match_data?: Json | null
          penalties_score?: Json | null
          period_scores?: Json | null
          referee_id?: string | null
          round_label?: string | null
          round_number?: number | null
          scheduled_at?: string | null
          scorer_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          venue_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_athlete_id_fkey"
            columns: ["away_athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_away_school_team_id_fkey"
            columns: ["away_school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_athlete_id_fkey"
            columns: ["home_athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_school_team_id_fkey"
            columns: ["home_school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_scores: {
        Row: {
          athlete_id: string | null
          created_at: string
          fixture_id: string
          id: string
          is_anonymous: boolean | null
          judge_id: string
          notes: string | null
          rubric: Json
          team_id: string | null
          total_score: number | null
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          fixture_id: string
          id?: string
          is_anonymous?: boolean | null
          judge_id: string
          notes?: string | null
          rubric?: Json
          team_id?: string | null
          total_score?: number | null
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          fixture_id?: string
          id?: string
          is_anonymous?: boolean | null
          judge_id?: string
          notes?: string | null
          rubric?: Json
          team_id?: string | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "judge_scores_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_scores_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_coaches: {
        Row: {
          certification: string | null
          created_at: string
          disciplines: string[]
          email: string | null
          first_name: string
          gender: string | null
          id: string
          id_number: string | null
          is_active: boolean
          is_ss_school: boolean
          is_verified: boolean
          last_name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          school_name: string | null
          ss_school_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          certification?: string | null
          created_at?: string
          disciplines?: string[]
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          id_number?: string | null
          is_active?: boolean
          is_ss_school?: boolean
          is_verified?: boolean
          last_name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          school_name?: string | null
          ss_school_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          certification?: string | null
          created_at?: string
          disciplines?: string[]
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          id_number?: string | null
          is_active?: boolean
          is_ss_school?: boolean
          is_verified?: boolean
          last_name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          school_name?: string | null
          ss_school_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      nexus_student_activity: {
        Row: {
          activity_type: string
          athlete_id: string | null
          competition_id: string | null
          competition_name: string | null
          created_at: string
          description: string | null
          fixture_id: string | null
          id: string
          occurred_at: string
          sport: string
          ss_school_id: string | null
          ss_student_id: string
          value: number | null
        }
        Insert: {
          activity_type: string
          athlete_id?: string | null
          competition_id?: string | null
          competition_name?: string | null
          created_at?: string
          description?: string | null
          fixture_id?: string | null
          id?: string
          occurred_at?: string
          sport: string
          ss_school_id?: string | null
          ss_student_id: string
          value?: number | null
        }
        Update: {
          activity_type?: string
          athlete_id?: string | null
          competition_id?: string | null
          competition_name?: string | null
          created_at?: string
          description?: string | null
          fixture_id?: string | null
          id?: string
          occurred_at?: string
          sport?: string
          ss_school_id?: string | null
          ss_student_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_student_activity_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_student_activity_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_student_activity_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      official_assignments: {
        Row: {
          competition_id: string | null
          created_at: string
          fixture_id: string | null
          id: string
          official_id: string
          payment_status: string | null
          role: string
          status: string | null
          stipend: number | null
        }
        Insert: {
          competition_id?: string | null
          created_at?: string
          fixture_id?: string | null
          id?: string
          official_id: string
          payment_status?: string | null
          role: string
          status?: string | null
          stipend?: number | null
        }
        Update: {
          competition_id?: string | null
          created_at?: string
          fixture_id?: string | null
          id?: string
          official_id?: string
          payment_status?: string | null
          role?: string
          status?: string | null
          stipend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "official_assignments_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_assignments_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_assignments_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      officials: {
        Row: {
          bank_account: Json | null
          certification_level: string | null
          created_at: string
          disciplines: string[]
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          performance_rating: number | null
          province: string | null
          qualifications: string[] | null
          role: string
          total_matches: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account?: Json | null
          certification_level?: string | null
          created_at?: string
          disciplines: string[]
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          performance_rating?: number | null
          province?: string | null
          qualifications?: string[] | null
          role: string
          total_matches?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account?: Json | null
          certification_level?: string | null
          created_at?: string
          disciplines?: string[]
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          performance_rating?: number | null
          province?: string | null
          qualifications?: string[] | null
          role?: string
          total_matches?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          competition_id: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          fixture_id: string | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
        }
        Insert: {
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          fixture_id?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question: string
        }
        Update: {
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          fixture_id?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          province: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          province?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          province?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      records: {
        Row: {
          achieved_at: string | null
          age_group: string | null
          athlete_id: string | null
          competition_id: string | null
          created_at: string
          discipline: string
          event_name: string
          fixture_id: string | null
          gender: string | null
          id: string
          is_verified: boolean | null
          previous_record: string | null
          province: string | null
          record_type: string
          team_id: string | null
          unit: string | null
          value: string
          verified_by: string | null
        }
        Insert: {
          achieved_at?: string | null
          age_group?: string | null
          athlete_id?: string | null
          competition_id?: string | null
          created_at?: string
          discipline: string
          event_name: string
          fixture_id?: string | null
          gender?: string | null
          id?: string
          is_verified?: boolean | null
          previous_record?: string | null
          province?: string | null
          record_type: string
          team_id?: string | null
          unit?: string | null
          value: string
          verified_by?: string | null
        }
        Update: {
          achieved_at?: string | null
          age_group?: string | null
          athlete_id?: string | null
          competition_id?: string | null
          created_at?: string
          discipline?: string
          event_name?: string
          fixture_id?: string | null
          gender?: string | null
          id?: string
          is_verified?: boolean | null
          previous_record?: string | null
          province?: string | null
          record_type?: string
          team_id?: string | null
          unit?: string | null
          value?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          athlete_id: string | null
          competition_id: string
          created_at: string
          division: string | null
          id: string
          notes: string | null
          payment_status: string | null
          registration_type: string
          reviewed_by: string | null
          seed_number: number | null
          status: Database["public"]["Enums"]["registration_status"]
          submitted_by: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          competition_id: string
          created_at?: string
          division?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          registration_type: string
          reviewed_by?: string | null
          seed_number?: number | null
          status?: Database["public"]["Enums"]["registration_status"]
          submitted_by?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          competition_id?: string
          created_at?: string
          division?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          registration_type?: string
          reviewed_by?: string | null
          seed_number?: number | null
          status?: Database["public"]["Enums"]["registration_status"]
          submitted_by?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scholastic_card_verifications: {
        Row: {
          athlete_id: string | null
          card_scan_data: string | null
          created_at: string
          fixture_id: string | null
          id: string
          jti: string | null
          nonce: string | null
          notes: string | null
          ss_student_id: string
          status: string
          student_payload: Json | null
          verification_method: string
          verified_by: string | null
        }
        Insert: {
          athlete_id?: string | null
          card_scan_data?: string | null
          created_at?: string
          fixture_id?: string | null
          id?: string
          jti?: string | null
          nonce?: string | null
          notes?: string | null
          ss_student_id: string
          status?: string
          student_payload?: Json | null
          verification_method?: string
          verified_by?: string | null
        }
        Update: {
          athlete_id?: string | null
          card_scan_data?: string | null
          created_at?: string
          fixture_id?: string | null
          id?: string
          jti?: string | null
          nonce?: string | null
          notes?: string | null
          ss_student_id?: string
          status?: string
          student_payload?: Json | null
          verification_method?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scholastic_card_verifications_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      school_staff: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          id: string
          is_active: boolean
          last_synced_at: string
          name: string
          phone: string | null
          primary_role: string | null
          roles: string[]
          sport_relevant: boolean
          sports: string[]
          ss_school_id: string
          ss_staff_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string
          name: string
          phone?: string | null
          primary_role?: string | null
          roles?: string[]
          sport_relevant?: boolean
          sports?: string[]
          ss_school_id: string
          ss_staff_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string
          name?: string
          phone?: string | null
          primary_role?: string | null
          roles?: string[]
          sport_relevant?: boolean
          sports?: string[]
          ss_school_id?: string
          ss_staff_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      school_team_players: {
        Row: {
          added_by: string | null
          athlete_id: string
          created_at: string
          id: string
          is_captain: boolean
          jersey_number: number | null
          position: string | null
          school_team_id: string
        }
        Insert: {
          added_by?: string | null
          athlete_id: string
          created_at?: string
          id?: string
          is_captain?: boolean
          jersey_number?: number | null
          position?: string | null
          school_team_id: string
        }
        Update: {
          added_by?: string | null
          athlete_id?: string
          created_at?: string
          id?: string
          is_captain?: boolean
          jersey_number?: number | null
          position?: string | null
          school_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_team_players_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_team_players_school_team_id_fkey"
            columns: ["school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      school_teams: {
        Row: {
          age_group: string | null
          coach_name: string | null
          coach_ss_staff_id: string | null
          created_at: string
          created_by: string | null
          discipline: string
          gender: string | null
          id: string
          is_published: boolean
          name: string
          published_at: string | null
          school_id: string
          season: string | null
          team_photo_url: string | null
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          coach_name?: string | null
          coach_ss_staff_id?: string | null
          created_at?: string
          created_by?: string | null
          discipline: string
          gender?: string | null
          id?: string
          is_published?: boolean
          name: string
          published_at?: string | null
          school_id: string
          season?: string | null
          team_photo_url?: string | null
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          coach_name?: string | null
          coach_ss_staff_id?: string | null
          created_at?: string
          created_by?: string | null
          discipline?: string
          gender?: string | null
          id?: string
          is_published?: boolean
          name?: string
          published_at?: string | null
          school_id?: string
          season?: string | null
          team_photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_teams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      score_entries: {
        Row: {
          athlete_id: string | null
          created_at: string
          event_type: string
          fixture_id: string
          id: string
          metadata: Json | null
          minute: number | null
          period: string | null
          scorer_id: string | null
          team_id: string | null
          value: number | null
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          event_type: string
          fixture_id: string
          id?: string
          metadata?: Json | null
          minute?: number | null
          period?: string | null
          scorer_id?: string | null
          team_id?: string | null
          value?: number | null
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          event_type?: string
          fixture_id?: string
          id?: string
          metadata?: Json | null
          minute?: number | null
          period?: string | null
          scorer_id?: string | null
          team_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "score_entries_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_entries_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorships: {
        Row: {
          amount: number | null
          billboard_slots: Json | null
          competition_id: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string
          id: string
          sponsor_logo: string | null
          sponsor_name: string
          tier: string | null
        }
        Insert: {
          amount?: number | null
          billboard_slots?: Json | null
          competition_id?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          id?: string
          sponsor_logo?: string | null
          sponsor_name: string
          tier?: string | null
        }
        Update: {
          amount?: number | null
          billboard_slots?: Json | null
          competition_id?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          id?: string
          sponsor_logo?: string | null
          sponsor_name?: string
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      ss_sync_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          performed_by: string | null
          schools_synced: number
          status: string
          students_synced: number
          sync_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          performed_by?: string | null
          schools_synced?: number
          status: string
          students_synced?: number
          sync_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          performed_by?: string | null
          schools_synced?: number
          status?: string
          students_synced?: number
          sync_type?: string
        }
        Relationships: []
      }
      standings: {
        Row: {
          athlete_id: string | null
          bonus_points: number | null
          competition_id: string
          drawn: number | null
          form: string[] | null
          id: string
          lost: number | null
          played: number | null
          points: number | null
          position: number | null
          score_against: number | null
          score_diff: number | null
          score_for: number | null
          team_id: string | null
          updated_at: string
          won: number | null
        }
        Insert: {
          athlete_id?: string | null
          bonus_points?: number | null
          competition_id: string
          drawn?: number | null
          form?: string[] | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          position?: number | null
          score_against?: number | null
          score_diff?: number | null
          score_for?: number | null
          team_id?: string | null
          updated_at?: string
          won?: number | null
        }
        Update: {
          athlete_id?: string | null
          bonus_points?: number | null
          competition_id?: string
          drawn?: number | null
          form?: string[] | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          position?: number | null
          score_against?: number | null
          score_diff?: number | null
          score_for?: number | null
          team_id?: string | null
          updated_at?: string
          won?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "standings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_sheets: {
        Row: {
          age_group: string | null
          competition_id: string | null
          created_at: string
          discipline: string
          id: string
          players: Json
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          submitted_by_name: string
          submitted_by_user_id: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          competition_id?: string | null
          created_at?: string
          discipline: string
          id?: string
          players?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_by_name: string
          submitted_by_user_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          competition_id?: string | null
          created_at?: string
          discipline?: string
          id?: string
          players?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_by_name?: string
          submitted_by_user_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_sheets_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_sheets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          club_name: string | null
          created_at: string
          discipline: string
          external_school_id: string | null
          founded_year: number | null
          id: string
          is_active: boolean | null
          is_ss_school: boolean
          kit_colors: string[] | null
          level: Database["public"]["Enums"]["competition_level"] | null
          logo_url: string | null
          manager_id: string | null
          name: string
          province: string | null
          school_name: string | null
          short_name: string | null
          sport: string | null
          sports_offered: string[] | null
          updated_at: string
        }
        Insert: {
          club_name?: string | null
          created_at?: string
          discipline: string
          external_school_id?: string | null
          founded_year?: number | null
          id?: string
          is_active?: boolean | null
          is_ss_school?: boolean
          kit_colors?: string[] | null
          level?: Database["public"]["Enums"]["competition_level"] | null
          logo_url?: string | null
          manager_id?: string | null
          name: string
          province?: string | null
          school_name?: string | null
          short_name?: string | null
          sport?: string | null
          sports_offered?: string[] | null
          updated_at?: string
        }
        Update: {
          club_name?: string | null
          created_at?: string
          discipline?: string
          external_school_id?: string | null
          founded_year?: number | null
          id?: string
          is_active?: boolean | null
          is_ss_school?: boolean
          kit_colors?: string[] | null
          level?: Database["public"]["Enums"]["competition_level"] | null
          logo_url?: string | null
          manager_id?: string | null
          name?: string
          province?: string | null
          school_name?: string | null
          short_name?: string | null
          sport?: string | null
          sports_offered?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venue_bookings: {
        Row: {
          booked_by: string | null
          competition_id: string | null
          created_at: string
          end_time: string
          fixture_id: string | null
          id: string
          notes: string | null
          start_time: string
          status: string | null
          venue_id: string
        }
        Insert: {
          booked_by?: string | null
          competition_id?: string | null
          created_at?: string
          end_time: string
          fixture_id?: string | null
          id?: string
          notes?: string | null
          start_time: string
          status?: string | null
          venue_id: string
        }
        Update: {
          booked_by?: string | null
          competition_id?: string | null
          created_at?: string
          end_time?: string
          fixture_id?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          status?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_bookings_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_bookings_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          capacity: number | null
          city: string
          created_at: string
          equipment_inventory: Json | null
          facilities: string[] | null
          id: string
          is_active: boolean | null
          lat: number | null
          lng: number | null
          name: string
          province: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city: string
          created_at?: string
          equipment_inventory?: Json | null
          facilities?: string[] | null
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          province: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city?: string
          created_at?: string
          equipment_inventory?: Json | null
          facilities?: string[] | null
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          province?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      nexus_student_sports_profile: {
        Row: {
          disciplines: string[] | null
          goals_scored: number | null
          is_ss_linked: boolean | null
          matches_played: number | null
          nexus_sport: string | null
          photo_url: string | null
          player_name: string | null
          scholastic_card_verified: boolean | null
          ss_school_id: string | null
          ss_student_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "federation_official"
        | "referee"
        | "scorer"
        | "broadcaster"
        | "athlete"
        | "team_manager"
        | "school_coordinator"
        | "viewer"
        | "coach"
        | "hic"
        | "umpire"
      bracket_format:
        | "round_robin"
        | "single_elimination"
        | "double_elimination"
        | "swiss"
        | "league"
        | "ladder"
        | "custom_heats"
        | "pooled"
      competition_level:
        | "primary_school"
        | "secondary_school"
        | "club_academy"
        | "provincial"
        | "national_league"
        | "national_cup"
        | "international"
      competition_status:
        | "draft"
        | "registration_open"
        | "registration_closed"
        | "ongoing"
        | "completed"
        | "cancelled"
      disciplinary_severity:
        | "warning"
        | "yellow_card"
        | "red_card"
        | "suspension"
        | "ban"
        | "lifetime_ban"
      match_status:
        | "scheduled"
        | "live"
        | "completed"
        | "postponed"
        | "cancelled"
        | "awarded"
      registration_status:
        | "pending"
        | "approved"
        | "rejected"
        | "withdrawn"
        | "suspended"
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
      app_role: [
        "super_admin",
        "admin",
        "federation_official",
        "referee",
        "scorer",
        "broadcaster",
        "athlete",
        "team_manager",
        "school_coordinator",
        "viewer",
        "coach",
        "hic",
        "umpire",
      ],
      bracket_format: [
        "round_robin",
        "single_elimination",
        "double_elimination",
        "swiss",
        "league",
        "ladder",
        "custom_heats",
        "pooled",
      ],
      competition_level: [
        "primary_school",
        "secondary_school",
        "club_academy",
        "provincial",
        "national_league",
        "national_cup",
        "international",
      ],
      competition_status: [
        "draft",
        "registration_open",
        "registration_closed",
        "ongoing",
        "completed",
        "cancelled",
      ],
      disciplinary_severity: [
        "warning",
        "yellow_card",
        "red_card",
        "suspension",
        "ban",
        "lifetime_ban",
      ],
      match_status: [
        "scheduled",
        "live",
        "completed",
        "postponed",
        "cancelled",
        "awarded",
      ],
      registration_status: [
        "pending",
        "approved",
        "rejected",
        "withdrawn",
        "suspended",
      ],
    },
  },
} as const
