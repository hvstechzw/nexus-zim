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
          academic_year: string | null
          age_group: string | null
          bio: string | null
          club_name: string | null
          created_at: string
          date_of_birth: string | null
          disciplines: string[]
          display_name: string | null
          dominant_hand: string | null
          dual_enrollment_flagged: boolean | null
          external_student_id: string | null
          first_name: string
          form_level: string | null
          gender: string | null
          height_cm: number | null
          house: string | null
          id: string
          id_card_number: string | null
          is_active: boolean | null
          is_ss_linked: boolean
          is_suspended: boolean | null
          jersey_number: number | null
          last_name: string
          medical_cleared: boolean | null
          medical_waiver_date: string | null
          medical_waiver_signed: boolean | null
          nash_athlete_id: string | null
          nash_id: string | null
          nexus_sport: string | null
          nfc_tag: string | null
          parent_consent: boolean | null
          parental_consent: boolean | null
          personal_bests: Json | null
          photo_url: string | null
          preferred_position: string | null
          previous_clubs: string | null
          primary_sport: string | null
          province: string
          qr_code: string | null
          scholastic_card_verified: boolean
          school_name: string | null
          secondary_position: string | null
          ss_school_id: string | null
          updated_at: string
          user_id: string | null
          weight_kg: number | null
          years_playing: number | null
        }
        Insert: {
          academic_year?: string | null
          age_group?: string | null
          bio?: string | null
          club_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          disciplines: string[]
          display_name?: string | null
          dominant_hand?: string | null
          dual_enrollment_flagged?: boolean | null
          external_student_id?: string | null
          first_name: string
          form_level?: string | null
          gender?: string | null
          height_cm?: number | null
          house?: string | null
          id?: string
          id_card_number?: string | null
          is_active?: boolean | null
          is_ss_linked?: boolean
          is_suspended?: boolean | null
          jersey_number?: number | null
          last_name: string
          medical_cleared?: boolean | null
          medical_waiver_date?: string | null
          medical_waiver_signed?: boolean | null
          nash_athlete_id?: string | null
          nash_id?: string | null
          nexus_sport?: string | null
          nfc_tag?: string | null
          parent_consent?: boolean | null
          parental_consent?: boolean | null
          personal_bests?: Json | null
          photo_url?: string | null
          preferred_position?: string | null
          previous_clubs?: string | null
          primary_sport?: string | null
          province: string
          qr_code?: string | null
          scholastic_card_verified?: boolean
          school_name?: string | null
          secondary_position?: string | null
          ss_school_id?: string | null
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
          years_playing?: number | null
        }
        Update: {
          academic_year?: string | null
          age_group?: string | null
          bio?: string | null
          club_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          disciplines?: string[]
          display_name?: string | null
          dominant_hand?: string | null
          dual_enrollment_flagged?: boolean | null
          external_student_id?: string | null
          first_name?: string
          form_level?: string | null
          gender?: string | null
          height_cm?: number | null
          house?: string | null
          id?: string
          id_card_number?: string | null
          is_active?: boolean | null
          is_ss_linked?: boolean
          is_suspended?: boolean | null
          jersey_number?: number | null
          last_name?: string
          medical_cleared?: boolean | null
          medical_waiver_date?: string | null
          medical_waiver_signed?: boolean | null
          nash_athlete_id?: string | null
          nash_id?: string | null
          nexus_sport?: string | null
          nfc_tag?: string | null
          parent_consent?: boolean | null
          parental_consent?: boolean | null
          personal_bests?: Json | null
          photo_url?: string | null
          preferred_position?: string | null
          previous_clubs?: string | null
          primary_sport?: string | null
          province?: string
          qr_code?: string | null
          scholastic_card_verified?: boolean
          school_name?: string | null
          secondary_position?: string | null
          ss_school_id?: string | null
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
          years_playing?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_nash_athlete_id_fkey"
            columns: ["nash_athlete_id"]
            isOneToOne: false
            referencedRelation: "nash_athlete_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      athletics_events: {
        Row: {
          age_group: string | null
          competition_id: string | null
          created_at: string | null
          event_name: string
          event_type: string | null
          final_places: number | null
          gender: string | null
          has_heats: boolean | null
          has_semifinals: boolean | null
          id: string
          status: string | null
          unit: string | null
          wind_legal_limit: number | null
        }
        Insert: {
          age_group?: string | null
          competition_id?: string | null
          created_at?: string | null
          event_name: string
          event_type?: string | null
          final_places?: number | null
          gender?: string | null
          has_heats?: boolean | null
          has_semifinals?: boolean | null
          id?: string
          status?: string | null
          unit?: string | null
          wind_legal_limit?: number | null
        }
        Update: {
          age_group?: string | null
          competition_id?: string | null
          created_at?: string | null
          event_name?: string
          event_type?: string | null
          final_places?: number | null
          gender?: string | null
          has_heats?: boolean | null
          has_semifinals?: boolean | null
          id?: string
          status?: string | null
          unit?: string | null
          wind_legal_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athletics_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      athletics_results: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          is_record: boolean | null
          lane_or_bib: number | null
          nash_athlete_id: string | null
          performance: string
          points_earned: number | null
          position: number | null
          record_type: string | null
          round: string | null
          school_team_id: string | null
          wind_reading: number | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_record?: boolean | null
          lane_or_bib?: number | null
          nash_athlete_id?: string | null
          performance: string
          points_earned?: number | null
          position?: number | null
          record_type?: string | null
          round?: string | null
          school_team_id?: string | null
          wind_reading?: number | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_record?: boolean | null
          lane_or_bib?: number | null
          nash_athlete_id?: string | null
          performance?: string
          points_earned?: number | null
          position?: number | null
          record_type?: string | null
          round?: string | null
          school_team_id?: string | null
          wind_reading?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athletics_results_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "athletics_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletics_results_nash_athlete_id_fkey"
            columns: ["nash_athlete_id"]
            isOneToOne: false
            referencedRelation: "nash_athlete_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletics_results_school_team_id_fkey"
            columns: ["school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
            referencedColumns: ["id"]
          },
        ]
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
      calendar_events: {
        Row: {
          competition_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discipline: string
          end_date: string | null
          event_type: string
          id: string
          level: string
          region: string | null
          season: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discipline: string
          end_date?: string | null
          event_type?: string
          id?: string
          level: string
          region?: string | null
          season?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discipline?: string
          end_date?: string | null
          event_type?: string
          id?: string
          level?: string
          region?: string | null
          season?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
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
          entry_fee_per_team: number | null
          format: Database["public"]["Enums"]["bracket_format"]
          gender: string | null
          group_count: number | null
          group_size: number | null
          host_school_id: string | null
          host_school_name: string | null
          id: string
          is_broadcast: boolean | null
          is_house_competition: boolean | null
          is_nash_sanctioned: boolean | null
          is_sports_day: boolean | null
          level: Database["public"]["Enums"]["competition_level"]
          logo_url: string | null
          match_report_url: string | null
          max_participants: number | null
          name: string
          nash_sanction_number: string | null
          nash_sport_id: string | null
          organisation_id: string | null
          parent_id: string | null
          points_config: Json | null
          prize_pool: number | null
          province: string | null
          registration_deadline: string | null
          requires_card_verification: boolean | null
          rules: Json | null
          season: string | null
          season_id: string | null
          slug: string | null
          sponsor: string | null
          stage: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["competition_status"]
          technical_delegate_id: string | null
          term: string | null
          tier: string | null
          total_entries: number | null
          updated_at: string
          venue_id: string | null
          weather_conditions: string | null
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discipline: string
          end_date?: string | null
          entry_fee?: number | null
          entry_fee_per_team?: number | null
          format?: Database["public"]["Enums"]["bracket_format"]
          gender?: string | null
          group_count?: number | null
          group_size?: number | null
          host_school_id?: string | null
          host_school_name?: string | null
          id?: string
          is_broadcast?: boolean | null
          is_house_competition?: boolean | null
          is_nash_sanctioned?: boolean | null
          is_sports_day?: boolean | null
          level: Database["public"]["Enums"]["competition_level"]
          logo_url?: string | null
          match_report_url?: string | null
          max_participants?: number | null
          name: string
          nash_sanction_number?: string | null
          nash_sport_id?: string | null
          organisation_id?: string | null
          parent_id?: string | null
          points_config?: Json | null
          prize_pool?: number | null
          province?: string | null
          registration_deadline?: string | null
          requires_card_verification?: boolean | null
          rules?: Json | null
          season?: string | null
          season_id?: string | null
          slug?: string | null
          sponsor?: string | null
          stage?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          technical_delegate_id?: string | null
          term?: string | null
          tier?: string | null
          total_entries?: number | null
          updated_at?: string
          venue_id?: string | null
          weather_conditions?: string | null
        }
        Update: {
          age_group?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discipline?: string
          end_date?: string | null
          entry_fee?: number | null
          entry_fee_per_team?: number | null
          format?: Database["public"]["Enums"]["bracket_format"]
          gender?: string | null
          group_count?: number | null
          group_size?: number | null
          host_school_id?: string | null
          host_school_name?: string | null
          id?: string
          is_broadcast?: boolean | null
          is_house_competition?: boolean | null
          is_nash_sanctioned?: boolean | null
          is_sports_day?: boolean | null
          level?: Database["public"]["Enums"]["competition_level"]
          logo_url?: string | null
          match_report_url?: string | null
          max_participants?: number | null
          name?: string
          nash_sanction_number?: string | null
          nash_sport_id?: string | null
          organisation_id?: string | null
          parent_id?: string | null
          points_config?: Json | null
          prize_pool?: number | null
          province?: string | null
          registration_deadline?: string | null
          requires_card_verification?: boolean | null
          rules?: Json | null
          season?: string | null
          season_id?: string | null
          slug?: string | null
          sponsor?: string | null
          stage?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          technical_delegate_id?: string | null
          term?: string | null
          tier?: string | null
          total_entries?: number | null
          updated_at?: string
          venue_id?: string | null
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitions_nash_sport_id_fkey"
            columns: ["nash_sport_id"]
            isOneToOne: false
            referencedRelation: "nash_sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "nash_organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "nash_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_technical_delegate_id_fkey"
            columns: ["technical_delegate_id"]
            isOneToOne: false
            referencedRelation: "nash_officials"
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
      external_invitations: {
        Row: {
          competition_id: string | null
          created_at: string
          external_id: string | null
          external_school_id: string | null
          external_student_id: string | null
          id: string
          kind: string
          payload: Json
          responded_at: string | null
          response: Json | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          competition_id?: string | null
          created_at?: string
          external_id?: string | null
          external_school_id?: string | null
          external_student_id?: string | null
          id?: string
          kind: string
          payload?: Json
          responded_at?: string | null
          response?: Json | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          competition_id?: string | null
          created_at?: string
          external_id?: string | null
          external_school_id?: string | null
          external_student_id?: string | null
          id?: string
          kind?: string
          payload?: Json
          responded_at?: string | null
          response?: Json | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      feed_items: {
        Row: {
          athlete_id: string | null
          body: string | null
          competition_id: string | null
          created_at: string
          fixture_id: string | null
          id: string
          image_url: string | null
          kind: string
          payload: Json
          school_team_id: string | null
          title: string
        }
        Insert: {
          athlete_id?: string | null
          body?: string | null
          competition_id?: string | null
          created_at?: string
          fixture_id?: string | null
          id?: string
          image_url?: string | null
          kind: string
          payload?: Json
          school_team_id?: string | null
          title: string
        }
        Update: {
          athlete_id?: string | null
          body?: string | null
          competition_id?: string | null
          created_at?: string
          fixture_id?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          payload?: Json
          school_team_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_school_team_id_fkey"
            columns: ["school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          advances_to_fixture_id: string | null
          away_athlete_id: string | null
          away_school_team_id: string | null
          away_score: number | null
          away_team_id: string | null
          bracket_round: number | null
          bracket_slot: string | null
          broadcast_url: string | null
          competition_id: string
          created_at: string
          ended_at: string | null
          extra_time_score: Json | null
          group_label: string | null
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
          advances_to_fixture_id?: string | null
          away_athlete_id?: string | null
          away_school_team_id?: string | null
          away_score?: number | null
          away_team_id?: string | null
          bracket_round?: number | null
          bracket_slot?: string | null
          broadcast_url?: string | null
          competition_id: string
          created_at?: string
          ended_at?: string | null
          extra_time_score?: Json | null
          group_label?: string | null
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
          advances_to_fixture_id?: string | null
          away_athlete_id?: string | null
          away_school_team_id?: string | null
          away_score?: number | null
          away_team_id?: string | null
          bracket_round?: number | null
          bracket_slot?: string | null
          broadcast_url?: string | null
          competition_id?: string
          created_at?: string
          ended_at?: string | null
          extra_time_score?: Json | null
          group_label?: string | null
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
            foreignKeyName: "fixtures_advances_to_fixture_id_fkey"
            columns: ["advances_to_fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
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
      follows: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
      match_commentary: {
        Row: {
          auto_generated: boolean
          created_at: string
          event_id: string | null
          fixture_id: string
          id: string
          text: string
          tone: string
        }
        Insert: {
          auto_generated?: boolean
          created_at?: string
          event_id?: string | null
          fixture_id: string
          id?: string
          text: string
          tone?: string
        }
        Update: {
          auto_generated?: boolean
          created_at?: string
          event_id?: string | null
          fixture_id?: string
          id?: string
          text?: string
          tone?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_commentary_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "match_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_commentary_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          assist_player_id: string | null
          clock_seconds: number
          created_at: string
          created_by: string | null
          event_type: string
          fixture_id: string
          id: string
          is_void: boolean
          notes: string | null
          period: string
          player_id: string | null
          sequence: number
          sport_code: string | null
          sub_type: string | null
          team_side: string
          value: number
          x: number | null
          y: number | null
        }
        Insert: {
          assist_player_id?: string | null
          clock_seconds?: number
          created_at?: string
          created_by?: string | null
          event_type: string
          fixture_id: string
          id?: string
          is_void?: boolean
          notes?: string | null
          period?: string
          player_id?: string | null
          sequence: number
          sport_code?: string | null
          sub_type?: string | null
          team_side: string
          value?: number
          x?: number | null
          y?: number | null
        }
        Update: {
          assist_player_id?: string | null
          clock_seconds?: number
          created_at?: string
          created_by?: string | null
          event_type?: string
          fixture_id?: string
          id?: string
          is_void?: boolean
          notes?: string | null
          period?: string
          player_id?: string | null
          sequence?: number
          sport_code?: string | null
          sub_type?: string | null
          team_side?: string
          value?: number
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_assist_player_id_fkey"
            columns: ["assist_player_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      match_state: {
        Row: {
          away_on_court: Json
          away_score: number
          clock_running: boolean
          clock_seconds: number
          fixture_id: string
          home_on_court: Json
          home_score: number
          last_event_id: string | null
          mvp_player_id: string | null
          period: string
          possession: string | null
          suspensions: Json
          updated_at: string
          win_prob_home: number
        }
        Insert: {
          away_on_court?: Json
          away_score?: number
          clock_running?: boolean
          clock_seconds?: number
          fixture_id: string
          home_on_court?: Json
          home_score?: number
          last_event_id?: string | null
          mvp_player_id?: string | null
          period?: string
          possession?: string | null
          suspensions?: Json
          updated_at?: string
          win_prob_home?: number
        }
        Update: {
          away_on_court?: Json
          away_score?: number
          clock_running?: boolean
          clock_seconds?: number
          fixture_id?: string
          home_on_court?: Json
          home_score?: number
          last_event_id?: string | null
          mvp_player_id?: string | null
          period?: string
          possession?: string | null
          suspensions?: Json
          updated_at?: string
          win_prob_home?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_state_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: true
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_state_last_event_id_fkey"
            columns: ["last_event_id"]
            isOneToOne: false
            referencedRelation: "match_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_state_mvp_player_id_fkey"
            columns: ["mvp_player_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      mom_votes: {
        Row: {
          athlete_id: string
          created_at: string
          fixture_id: string
          id: string
          user_id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          fixture_id: string
          id?: string
          user_id: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          fixture_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mom_votes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mom_votes_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      nash_athlete_registrations: {
        Row: {
          academic_check_date: string | null
          academic_checked_by: string | null
          academic_eligible: boolean | null
          age_group: string | null
          approved_at: string | null
          approved_by: string | null
          consent_document_url: string | null
          created_at: string | null
          id: string
          is_captain: boolean | null
          jersey_number: number | null
          medical_clearance_date: string | null
          medical_cleared: boolean | null
          medical_cleared_by: string | null
          medical_notes: string | null
          nash_athlete_id: string | null
          parental_consent: boolean | null
          position: string | null
          registration_status: string | null
          rejection_reason: string | null
          school_team_id: string | null
          season_id: string | null
          sport_id: string | null
        }
        Insert: {
          academic_check_date?: string | null
          academic_checked_by?: string | null
          academic_eligible?: boolean | null
          age_group?: string | null
          approved_at?: string | null
          approved_by?: string | null
          consent_document_url?: string | null
          created_at?: string | null
          id?: string
          is_captain?: boolean | null
          jersey_number?: number | null
          medical_clearance_date?: string | null
          medical_cleared?: boolean | null
          medical_cleared_by?: string | null
          medical_notes?: string | null
          nash_athlete_id?: string | null
          parental_consent?: boolean | null
          position?: string | null
          registration_status?: string | null
          rejection_reason?: string | null
          school_team_id?: string | null
          season_id?: string | null
          sport_id?: string | null
        }
        Update: {
          academic_check_date?: string | null
          academic_checked_by?: string | null
          academic_eligible?: boolean | null
          age_group?: string | null
          approved_at?: string | null
          approved_by?: string | null
          consent_document_url?: string | null
          created_at?: string | null
          id?: string
          is_captain?: boolean | null
          jersey_number?: number | null
          medical_clearance_date?: string | null
          medical_cleared?: boolean | null
          medical_cleared_by?: string | null
          medical_notes?: string | null
          nash_athlete_id?: string | null
          parental_consent?: boolean | null
          position?: string | null
          registration_status?: string | null
          rejection_reason?: string | null
          school_team_id?: string | null
          season_id?: string | null
          sport_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nash_athlete_registrations_nash_athlete_id_fkey"
            columns: ["nash_athlete_id"]
            isOneToOne: false
            referencedRelation: "nash_athlete_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nash_athlete_registrations_school_team_id_fkey"
            columns: ["school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nash_athlete_registrations_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "nash_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nash_athlete_registrations_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "nash_sports"
            referencedColumns: ["id"]
          },
        ]
      }
      nash_athlete_registry: {
        Row: {
          created_at: string | null
          current_school_id: string | null
          current_school_name: string | null
          date_of_birth: string
          first_name: string
          gender: string | null
          id: string
          id_document_url: string | null
          id_number: string | null
          id_verified: boolean | null
          is_active: boolean | null
          is_suspended: boolean | null
          last_name: string
          lifetime_ban: boolean | null
          nash_id: string
          photo_url: string | null
          province: string | null
          scholastic_card_number: string | null
          ss_student_id: string | null
          suspension_reason: string | null
          suspension_until: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_school_id?: string | null
          current_school_name?: string | null
          date_of_birth: string
          first_name: string
          gender?: string | null
          id?: string
          id_document_url?: string | null
          id_number?: string | null
          id_verified?: boolean | null
          is_active?: boolean | null
          is_suspended?: boolean | null
          last_name: string
          lifetime_ban?: boolean | null
          nash_id: string
          photo_url?: string | null
          province?: string | null
          scholastic_card_number?: string | null
          ss_student_id?: string | null
          suspension_reason?: string | null
          suspension_until?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_school_id?: string | null
          current_school_name?: string | null
          date_of_birth?: string
          first_name?: string
          gender?: string | null
          id?: string
          id_document_url?: string | null
          id_number?: string | null
          id_verified?: boolean | null
          is_active?: boolean | null
          is_suspended?: boolean | null
          last_name?: string
          lifetime_ban?: boolean | null
          nash_id?: string
          photo_url?: string | null
          province?: string | null
          scholastic_card_number?: string | null
          ss_student_id?: string | null
          suspension_reason?: string | null
          suspension_until?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nash_awards: {
        Row: {
          award_name: string | null
          award_type: string | null
          awarded_at: string | null
          certificate_url: string | null
          coach_id: string | null
          competition_id: string | null
          description: string | null
          id: string
          nash_athlete_id: string | null
          official_id: string | null
          school_team_id: string | null
          season_id: string | null
          sport_id: string | null
          team_id: string | null
          trophy_due_date: string | null
          trophy_returned: boolean | null
        }
        Insert: {
          award_name?: string | null
          award_type?: string | null
          awarded_at?: string | null
          certificate_url?: string | null
          coach_id?: string | null
          competition_id?: string | null
          description?: string | null
          id?: string
          nash_athlete_id?: string | null
          official_id?: string | null
          school_team_id?: string | null
          season_id?: string | null
          sport_id?: string | null
          team_id?: string | null
          trophy_due_date?: string | null
          trophy_returned?: boolean | null
        }
        Update: {
          award_name?: string | null
          award_type?: string | null
          awarded_at?: string | null
          certificate_url?: string | null
          coach_id?: string | null
          competition_id?: string | null
          description?: string | null
          id?: string
          nash_athlete_id?: string | null
          official_id?: string | null
          school_team_id?: string | null
          season_id?: string | null
          sport_id?: string | null
          team_id?: string | null
          trophy_due_date?: string | null
          trophy_returned?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "nash_awards_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nash_awards_nash_athlete_id_fkey"
            columns: ["nash_athlete_id"]
            isOneToOne: false
            referencedRelation: "nash_athlete_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nash_awards_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "nash_officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nash_awards_school_team_id_fkey"
            columns: ["school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nash_awards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "nash_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nash_awards_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "nash_sports"
            referencedColumns: ["id"]
          },
        ]
      }
      nash_competition_budgets: {
        Row: {
          catering_costs: number | null
          competition_id: string | null
          created_at: string | null
          entry_fees_collected: number | null
          equipment_costs: number | null
          id: string
          notes: string | null
          official_stipends: number | null
          other_costs: number | null
          printing_costs: number | null
          sponsorship_received: number | null
          surplus_deficit: number | null
          total_budget: number | null
          transport_costs: number | null
          updated_at: string | null
          venue_costs: number | null
        }
        Insert: {
          catering_costs?: number | null
          competition_id?: string | null
          created_at?: string | null
          entry_fees_collected?: number | null
          equipment_costs?: number | null
          id?: string
          notes?: string | null
          official_stipends?: number | null
          other_costs?: number | null
          printing_costs?: number | null
          sponsorship_received?: number | null
          surplus_deficit?: number | null
          total_budget?: number | null
          transport_costs?: number | null
          updated_at?: string | null
          venue_costs?: number | null
        }
        Update: {
          catering_costs?: number | null
          competition_id?: string | null
          created_at?: string | null
          entry_fees_collected?: number | null
          equipment_costs?: number | null
          id?: string
          notes?: string | null
          official_stipends?: number | null
          other_costs?: number | null
          printing_costs?: number | null
          sponsorship_received?: number | null
          surplus_deficit?: number | null
          total_budget?: number | null
          transport_costs?: number | null
          updated_at?: string | null
          venue_costs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nash_competition_budgets_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      nash_competition_tiers: {
        Row: {
          advances_count: number | null
          code: string | null
          id: string
          level_order: number | null
          min_ss_package: string | null
          name: string | null
          requires_card_verification: boolean | null
          requires_ss_integration: boolean | null
        }
        Insert: {
          advances_count?: number | null
          code?: string | null
          id?: string
          level_order?: number | null
          min_ss_package?: string | null
          name?: string | null
          requires_card_verification?: boolean | null
          requires_ss_integration?: boolean | null
        }
        Update: {
          advances_count?: number | null
          code?: string | null
          id?: string
          level_order?: number | null
          min_ss_package?: string | null
          name?: string | null
          requires_card_verification?: boolean | null
          requires_ss_integration?: boolean | null
        }
        Relationships: []
      }
      nash_eligibility_flags: {
        Row: {
          description: string | null
          flag_type: string | null
          id: string
          nash_athlete_id: string | null
          raised_at: string | null
          raised_by: string | null
          registration_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          description?: string | null
          flag_type?: string | null
          id?: string
          nash_athlete_id?: string | null
          raised_at?: string | null
          raised_by?: string | null
          registration_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          description?: string | null
          flag_type?: string | null
          id?: string
          nash_athlete_id?: string | null
          raised_at?: string | null
          raised_by?: string | null
          registration_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nash_eligibility_flags_nash_athlete_id_fkey"
            columns: ["nash_athlete_id"]
            isOneToOne: false
            referencedRelation: "nash_athlete_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nash_eligibility_flags_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "nash_athlete_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      nash_entry_fee_payments: {
        Row: {
          amount: number | null
          competition_id: string | null
          created_at: string | null
          id: string
          nexus_fee_15pct: number | null
          nexus_fee_paid: boolean | null
          notes: string | null
          organiser_amount: number | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          receipt_number: string | null
          received_by: string | null
          school_team_id: string | null
        }
        Insert: {
          amount?: number | null
          competition_id?: string | null
          created_at?: string | null
          id?: string
          nexus_fee_15pct?: number | null
          nexus_fee_paid?: boolean | null
          notes?: string | null
          organiser_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_number?: string | null
          received_by?: string | null
          school_team_id?: string | null
        }
        Update: {
          amount?: number | null
          competition_id?: string | null
          created_at?: string | null
          id?: string
          nexus_fee_15pct?: number | null
          nexus_fee_paid?: boolean | null
          notes?: string | null
          organiser_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_number?: string | null
          received_by?: string | null
          school_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nash_entry_fee_payments_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nash_entry_fee_payments_school_team_id_fkey"
            columns: ["school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      nash_members: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          id_number: string | null
          is_active: boolean | null
          last_name: string
          organisation_id: string | null
          phone: string | null
          photo_url: string | null
          role_title: string
          sports: string[] | null
          term_end: string | null
          term_start: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          id_number?: string | null
          is_active?: boolean | null
          last_name: string
          organisation_id?: string | null
          phone?: string | null
          photo_url?: string | null
          role_title: string
          sports?: string[] | null
          term_end?: string | null
          term_start?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          id_number?: string | null
          is_active?: boolean | null
          last_name?: string
          organisation_id?: string | null
          phone?: string | null
          photo_url?: string | null
          role_title?: string
          sports?: string[] | null
          term_end?: string | null
          term_start?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nash_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "nash_organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      nash_mopse_reports: {
        Row: {
          created_at: string | null
          id: string
          pdf_url: string | null
          report_data: Json | null
          report_type: string | null
          season_id: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          report_data?: Json | null
          report_type?: string | null
          season_id?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          report_data?: Json | null
          report_type?: string | null
          season_id?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nash_mopse_reports_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "nash_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      nash_officials: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          certification_body: string | null
          certification_date: string | null
          certification_expiry: string | null
          created_at: string | null
          date_of_birth: string | null
          district: string | null
          email: string | null
          first_name: string
          gender: string | null
          grade: string | null
          id: string
          id_number: string | null
          is_active: boolean | null
          is_verified: boolean | null
          last_name: string
          nash_official_id: string | null
          notes: string | null
          other_roles: string[] | null
          performance_rating: number | null
          phone: string | null
          photo_url: string | null
          primary_role: string | null
          province: string | null
          sports: string[]
          total_matches: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          certification_body?: string | null
          certification_date?: string | null
          certification_expiry?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          district?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          grade?: string | null
          id?: string
          id_number?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_name: string
          nash_official_id?: string | null
          notes?: string | null
          other_roles?: string[] | null
          performance_rating?: number | null
          phone?: string | null
          photo_url?: string | null
          primary_role?: string | null
          province?: string | null
          sports?: string[]
          total_matches?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          certification_body?: string | null
          certification_date?: string | null
          certification_expiry?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          district?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          grade?: string | null
          id?: string
          id_number?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_name?: string
          nash_official_id?: string | null
          notes?: string | null
          other_roles?: string[] | null
          performance_rating?: number | null
          phone?: string | null
          photo_url?: string | null
          primary_role?: string | null
          province?: string | null
          sports?: string[]
          total_matches?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      nash_organisations: {
        Row: {
          chair_name: string | null
          created_at: string | null
          district: string | null
          email: string | null
          established_year: number | null
          id: string
          is_active: boolean | null
          level: string | null
          logo_url: string | null
          name: string
          parent_id: string | null
          phone: string | null
          physical_address: string | null
          province: string | null
          secretary_name: string | null
          treasurer_name: string | null
          type: string | null
          updated_at: string | null
          zone: string | null
        }
        Insert: {
          chair_name?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          established_year?: number | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          logo_url?: string | null
          name: string
          parent_id?: string | null
          phone?: string | null
          physical_address?: string | null
          province?: string | null
          secretary_name?: string | null
          treasurer_name?: string | null
          type?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Update: {
          chair_name?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          established_year?: number | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          logo_url?: string | null
          name?: string
          parent_id?: string | null
          phone?: string | null
          physical_address?: string | null
          province?: string | null
          secretary_name?: string | null
          treasurer_name?: string | null
          type?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nash_organisations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "nash_organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      nash_seasons: {
        Row: {
          academic_year: string
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_current: boolean | null
          name: string | null
          registration_deadline: string | null
          start_date: string | null
          term: number | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          name?: string | null
          registration_deadline?: string | null
          start_date?: string | null
          term?: number | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          name?: string | null
          registration_deadline?: string | null
          start_date?: string | null
          term?: number | null
        }
        Relationships: []
      }
      nash_sports: {
        Row: {
          age_groups: string[] | null
          applicable_to: string[] | null
          code: string
          created_at: string | null
          full_name: string | null
          gender: string | null
          has_extra_time: boolean | null
          has_penalties: boolean | null
          has_suspension: boolean | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          max_squad_size: number | null
          min_squad_size: number | null
          name: string
          period_duration_minutes: number | null
          periods: number | null
          players_on_field: number | null
          primary_term: number | null
          rules_document_url: string | null
          scoring_config: Json | null
          scoring_type: string | null
          secondary_term: number | null
        }
        Insert: {
          age_groups?: string[] | null
          applicable_to?: string[] | null
          code: string
          created_at?: string | null
          full_name?: string | null
          gender?: string | null
          has_extra_time?: boolean | null
          has_penalties?: boolean | null
          has_suspension?: boolean | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          max_squad_size?: number | null
          min_squad_size?: number | null
          name: string
          period_duration_minutes?: number | null
          periods?: number | null
          players_on_field?: number | null
          primary_term?: number | null
          rules_document_url?: string | null
          scoring_config?: Json | null
          scoring_type?: string | null
          secondary_term?: number | null
        }
        Update: {
          age_groups?: string[] | null
          applicable_to?: string[] | null
          code?: string
          created_at?: string | null
          full_name?: string | null
          gender?: string | null
          has_extra_time?: boolean | null
          has_penalties?: boolean | null
          has_suspension?: boolean | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          max_squad_size?: number | null
          min_squad_size?: number | null
          name?: string
          period_duration_minutes?: number | null
          periods?: number | null
          players_on_field?: number | null
          primary_term?: number | null
          rules_document_url?: string | null
          scoring_config?: Json | null
          scoring_type?: string | null
          secondary_term?: number | null
        }
        Relationships: []
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
      player_badges: {
        Row: {
          athlete_id: string
          awarded_at: string
          code: string
          context: Json
          id: string
          label: string
        }
        Insert: {
          athlete_id: string
          awarded_at?: string
          code: string
          context?: Json
          id?: string
          label: string
        }
        Update: {
          athlete_id?: string
          awarded_at?: string
          code?: string
          context?: Json
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_badges_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
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
      region_admin_assignments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          district_name: string | null
          id: string
          level: string
          notes: string | null
          province_name: string | null
          status: string
          updated_at: string
          user_id: string
          zone_name: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          district_name?: string | null
          id?: string
          level: string
          notes?: string | null
          province_name?: string | null
          status?: string
          updated_at?: string
          user_id: string
          zone_name?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          district_name?: string | null
          id?: string
          level?: string
          notes?: string | null
          province_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          zone_name?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          athlete_id: string | null
          competition_id: string
          created_at: string
          division: string | null
          group_label: string | null
          id: string
          notes: string | null
          payment_status: string | null
          registration_type: string
          reviewed_by: string | null
          school_team_id: string | null
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
          group_label?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          registration_type: string
          reviewed_by?: string | null
          school_team_id?: string | null
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
          group_label?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          registration_type?: string
          reviewed_by?: string | null
          school_team_id?: string | null
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
            foreignKeyName: "registrations_school_team_id_fkey"
            columns: ["school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
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
      role_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          payload: Json
          requested_role: Database["public"]["Enums"]["app_role"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          payload?: Json
          requested_role: Database["public"]["Enums"]["app_role"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          payload?: Json
          requested_role?: Database["public"]["Enums"]["app_role"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          external_ss_team_id: string | null
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
          external_ss_team_id?: string | null
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
          external_ss_team_id?: string | null
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
      share_cards: {
        Row: {
          athlete_id: string | null
          created_at: string
          created_by: string | null
          fixture_id: string | null
          id: string
          image_url: string | null
          kind: string
          payload: Json
          school_team_id: string | null
          slug: string
          subtitle: string | null
          title: string
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          created_by?: string | null
          fixture_id?: string | null
          id?: string
          image_url?: string | null
          kind: string
          payload?: Json
          school_team_id?: string | null
          slug: string
          subtitle?: string | null
          title: string
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          created_by?: string | null
          fixture_id?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          payload?: Json
          school_team_id?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_cards_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_cards_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_cards_school_team_id_fkey"
            columns: ["school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
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
          eligibility_checks_run: number | null
          error_message: string | null
          flags_raised: number | null
          id: string
          performed_by: string | null
          schools_synced: number
          season_id: string | null
          sport: string | null
          status: string
          students_synced: number
          sync_type: string
        }
        Insert: {
          created_at?: string
          eligibility_checks_run?: number | null
          error_message?: string | null
          flags_raised?: number | null
          id?: string
          performed_by?: string | null
          schools_synced?: number
          season_id?: string | null
          sport?: string | null
          status: string
          students_synced?: number
          sync_type: string
        }
        Update: {
          created_at?: string
          eligibility_checks_run?: number | null
          error_message?: string | null
          flags_raised?: number | null
          id?: string
          performed_by?: string | null
          schools_synced?: number
          season_id?: string | null
          sport?: string | null
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
          group_label: string | null
          id: string
          lost: number | null
          played: number | null
          points: number | null
          position: number | null
          school_team_id: string | null
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
          group_label?: string | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          position?: number | null
          school_team_id?: string | null
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
          group_label?: string | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          position?: number | null
          school_team_id?: string | null
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
            foreignKeyName: "standings_school_team_id_fkey"
            columns: ["school_team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
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
          booking_notes: string | null
          capacity: number | null
          city: string
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          equipment_inventory: Json | null
          facilities: string[] | null
          has_changing_rooms: boolean | null
          has_floodlights: boolean | null
          has_medical_room: boolean | null
          has_spectator_seating: boolean | null
          id: string
          is_active: boolean | null
          lat: number | null
          lng: number | null
          name: string
          nash_approved: boolean | null
          province: string
          school_id: string | null
          spectator_capacity: number | null
          sports_supported: string[] | null
          surface_type: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          booking_notes?: string | null
          capacity?: number | null
          city: string
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          equipment_inventory?: Json | null
          facilities?: string[] | null
          has_changing_rooms?: boolean | null
          has_floodlights?: boolean | null
          has_medical_room?: boolean | null
          has_spectator_seating?: boolean | null
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          nash_approved?: boolean | null
          province: string
          school_id?: string | null
          spectator_capacity?: number | null
          sports_supported?: string[] | null
          surface_type?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          booking_notes?: string | null
          capacity?: number | null
          city?: string
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          equipment_inventory?: Json | null
          facilities?: string[] | null
          has_changing_rooms?: boolean | null
          has_floodlights?: boolean | null
          has_medical_room?: boolean | null
          has_spectator_seating?: boolean | null
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          nash_approved?: boolean | null
          province?: string
          school_id?: string | null
          spectator_capacity?: number | null
          sports_supported?: string[] | null
          surface_type?: string | null
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
      vw_competition_top_players: {
        Row: {
          _ignored: number | null
          assists: number | null
          athlete_id: string | null
          competition_id: string | null
          defensive_actions: number | null
          goals: number | null
          impact_score: number | null
          points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_mom_tally: {
        Row: {
          athlete_id: string | null
          fixture_id: string | null
          rank: number | null
          votes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mom_votes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mom_votes_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_player_career: {
        Row: {
          assists: number | null
          athlete_id: string | null
          cards: number | null
          goals: number | null
          intercepts: number | null
          matches: number | null
          misses: number | null
          shooting_pct: number | null
          turnovers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_player_form: {
        Row: {
          assists: number | null
          athlete_id: string | null
          cards: number | null
          competition_id: string | null
          fixture_id: string | null
          goals: number | null
          intercepts: number | null
          scheduled_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_player_records: {
        Row: {
          athlete_id: string | null
          most_goals_in_match: number | null
          total_goals: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
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
      is_competition_organizer: { Args: { _uid: string }; Returns: boolean }
      nash_is_admin: { Args: { _user: string }; Returns: boolean }
      notify_users: {
        Args: {
          _body: string
          _data: Json
          _title: string
          _type: string
          _user_ids: string[]
        }
        Returns: undefined
      }
      recompute_match_state: {
        Args: { _fixture_id: string }
        Returns: undefined
      }
      recompute_standings: {
        Args: { _competition_id: string }
        Returns: undefined
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
        | "zonal_admin"
        | "district_admin"
        | "provincial_admin"
        | "national_admin"
        | "platform_admin"
        | "nash_national"
        | "naph_national"
        | "national_technical_director"
        | "provincial_technical_director"
        | "district_technical_director"
        | "school_head"
        | "timekeeper"
        | "technical_delegate"
        | "parent"
        | "public"
        | "competition_organiser"
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
        "zonal_admin",
        "district_admin",
        "provincial_admin",
        "national_admin",
        "platform_admin",
        "nash_national",
        "naph_national",
        "national_technical_director",
        "provincial_technical_director",
        "district_technical_director",
        "school_head",
        "timekeeper",
        "technical_delegate",
        "parent",
        "public",
        "competition_organiser",
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
