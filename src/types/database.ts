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
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          discord_tag: string | null
          last_active_at: string
          created_at: string
          allow_invites: boolean | null
          invites_from_followers_only: boolean | null
          is_private: boolean | null
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          discord_tag?: string | null
          last_active_at?: string
          created_at?: string
          allow_invites?: boolean | null
          invites_from_followers_only?: boolean | null
          is_private?: boolean | null
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          discord_tag?: string | null
          last_active_at?: string
          created_at?: string
          allow_invites?: boolean | null
          invites_from_followers_only?: boolean | null
          is_private?: boolean | null
        }
      }
      user_games: {
        Row: {
          id: string
          user_id: string
          game_id: string
          game_name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          game_name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          game_name?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      lobbies: {
        Row: {
          id: string
          host_id: string
          game_id: string
          game_name: string
          title: string
          description: string | null
          max_players: number | null
          platform: 'pc' | 'ps' | 'xbox' | 'switch' | 'mobile' | 'other'
          discord_link: string | null
          featured_guide_id: string | null
          status: 'open' | 'in_progress' | 'closed'
          host_last_active_at: string
          created_at: string
        }
        Insert: {
          id?: string
          host_id: string
          game_id: string
          game_name: string
          title: string
          description?: string | null
          max_players?: number | null
          platform: 'pc' | 'ps' | 'xbox' | 'switch' | 'mobile' | 'other'
          discord_link?: string | null
          featured_guide_id?: string | null
          status?: 'open' | 'in_progress' | 'closed'
          host_last_active_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          game_id?: string
          game_name?: string
          title?: string
          description?: string | null
          max_players?: number | null
          platform?: 'pc' | 'ps' | 'xbox' | 'switch' | 'mobile' | 'other'
          discord_link?: string | null
          featured_guide_id?: string | null
          status?: 'open' | 'in_progress' | 'closed'
          host_last_active_at?: string
          created_at?: string
        }
      }
      lobby_members: {
        Row: {
          id: string
          lobby_id: string
          user_id: string
          role: 'host' | 'member'
          ready: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          lobby_id: string
          user_id: string
          role: 'host' | 'member'
          ready?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          lobby_id?: string
          user_id?: string
          role?: 'host' | 'member'
          ready?: boolean
          joined_at?: string
        }
      }
      lobby_bans: {
        Row: {
          id: string
          lobby_id: string
          player_id: string
          banned_by: string
          created_at: string
        }
        Insert: {
          id?: string
          lobby_id: string
          player_id: string
          banned_by: string
          created_at?: string
        }
        Update: {
          id?: string
          lobby_id?: string
          player_id?: string
          banned_by?: string
          created_at?: string
        }
      }
      player_endorsements: {
        Row: {
          id: string
          player_id: string
          endorsed_by: string | null
          award_type: 'good_teammate' | 'strategic' | 'friendly' | 'chill'
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          endorsed_by?: string | null
          award_type: 'good_teammate' | 'strategic' | 'friendly' | 'chill'
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          endorsed_by?: string | null
          award_type?: 'good_teammate' | 'strategic' | 'friendly' | 'chill'
          created_at?: string
        }
      }
      player_reports: {
        Row: {
          id: string
          reported_player_id: string
          reporter_id: string
          reason: 'toxic_behavior' | 'cheating' | 'spam' | 'other'
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reported_player_id: string
          reporter_id: string
          reason: 'toxic_behavior' | 'cheating' | 'spam' | 'other'
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reported_player_id?: string
          reporter_id?: string
          reason?: 'toxic_behavior' | 'cheating' | 'spam' | 'other'
          details?: string | null
          created_at?: string
        }
      }
      lobby_messages: {
        Row: {
          id: string
          lobby_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          lobby_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          lobby_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      lobby_invites: {
        Row: {
          id: string
          lobby_id: string
          from_user_id: string
          to_user_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
        }
        Insert: {
          id?: string
          lobby_id: string
          from_user_id: string
          to_user_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
        Update: {
          id?: string
          lobby_id?: string
          from_user_id?: string
          to_user_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
      }
      game_communities: {
        Row: {
          id: string
          game_id: string
          game_name: string
          type: 'discord' | 'mumble' | 'website' | 'other'
          name: string
          description: string | null
          link: string
          submitted_by: string
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          game_name: string
          type: 'discord' | 'mumble' | 'website' | 'other'
          name: string
          description?: string | null
          link: string
          submitted_by: string
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          game_name?: string
          type?: 'discord' | 'mumble' | 'website' | 'other'
          name?: string
          description?: string | null
          link?: string
          submitted_by?: string
          created_at?: string
        }
      }
      game_guides: {
        Row: {
          id: string
          game_id: string
          game_name: string
          title: string
          url: string
          og_title: string | null
          og_description: string | null
          og_image_url: string | null
          submitted_by: string
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          game_name: string
          title: string
          url: string
          og_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          submitted_by: string
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          game_name?: string
          title?: string
          url?: string
          og_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          submitted_by?: string
          created_at?: string
        }
      }
      game_search_events: {
        Row: {
          id: string
          user_id: string | null
          game_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          game_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          game_id?: string
          created_at?: string
        }
      }
      weekly_rounds: {
        Row: {
          id: string
          week_key: string
          status: 'open' | 'locked' | 'processed'
          voting_ends_at: string
          events_generated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          week_key: string
          status?: 'open' | 'locked' | 'processed'
          voting_ends_at: string
          events_generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          week_key?: string
          status?: 'open' | 'locked' | 'processed'
          voting_ends_at?: string
          events_generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_game_candidates: {
        Row: {
          id: string
          round_id: string
          game_id: string
          game_name: string
          created_by: string
          total_votes: number
          created_at: string
        }
        Insert: {
          id?: string
          round_id: string
          game_id: string
          game_name: string
          created_by: string
          total_votes?: number
          created_at?: string
        }
        Update: {
          id?: string
          round_id?: string
          game_id?: string
          game_name?: string
          created_by?: string
          total_votes?: number
          created_at?: string
        }
      }
      weekly_game_votes: {
        Row: {
          id: string
          round_id: string
          candidate_id: string
          user_id: string
          time_pref: 'morning' | 'noon' | 'afternoon' | 'evening' | 'late_night'
          day_pref: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          round_id: string
          candidate_id: string
          user_id: string
          time_pref: 'morning' | 'noon' | 'afternoon' | 'evening' | 'late_night'
          day_pref?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          round_id?: string
          candidate_id?: string
          user_id?: string
          time_pref?: 'morning' | 'noon' | 'afternoon' | 'evening' | 'late_night'
          day_pref?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null
          created_at?: string
          updated_at?: string
        }
      }
      game_event_communities: {
        Row: {
          id: string
          game_id: string
          game_name: string
          description: string | null
          discord_link: string | null
          created_from_round_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          game_name: string
          description?: string | null
          discord_link?: string | null
          created_from_round_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          game_name?: string
          description?: string | null
          discord_link?: string | null
          created_from_round_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      game_event_community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          role: 'member' | 'mod' | 'owner'
          joined_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          role?: 'member' | 'mod' | 'owner'
          joined_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          role?: 'member' | 'mod' | 'owner'
          joined_at?: string
        }
      }
      events: {
        Row: {
          id: string
          game_id: string
          game_name: string
          community_id: string
          round_id: string
          starts_at: string
          ends_at: string
          time_slot: 'morning' | 'noon' | 'afternoon' | 'evening' | 'late_night'
          day_slot: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null
          status: 'scheduled' | 'ongoing' | 'ended' | 'cancelled'
          total_votes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          game_name: string
          community_id: string
          round_id: string
          starts_at: string
          ends_at: string
          time_slot: 'morning' | 'noon' | 'afternoon' | 'evening' | 'late_night'
          day_slot?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null
          status?: 'scheduled' | 'ongoing' | 'ended' | 'cancelled'
          total_votes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          game_name?: string
          community_id?: string
          round_id?: string
          starts_at?: string
          ends_at?: string
          time_slot?: 'morning' | 'noon' | 'afternoon' | 'evening' | 'late_night'
          day_slot?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null
          status?: 'scheduled' | 'ongoing' | 'ended' | 'cancelled'
          total_votes?: number
          created_at?: string
          updated_at?: string
        }
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'in' | 'maybe' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: 'in' | 'maybe' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'in' | 'maybe' | 'declined'
          created_at?: string
          updated_at?: string
        }
      }
      event_guides: {
        Row: {
          id: string
          event_id: string
          guide_id: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          guide_id: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          guide_id?: string
          created_at?: string
        }
      }
    }
    Functions: {
      close_inactive_lobbies: {
        Args: Record<string, never>
        Returns: void
      }
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserGame = Database['public']['Tables']['user_games']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type Lobby = Database['public']['Tables']['lobbies']['Row']
export type LobbyMember = Database['public']['Tables']['lobby_members']['Row']
export type LobbyMessage = Database['public']['Tables']['lobby_messages']['Row']
export type LobbyInvite = Database['public']['Tables']['lobby_invites']['Row']
export type LobbyBan = Database['public']['Tables']['lobby_bans']['Row']
export type PlayerEndorsement = Database['public']['Tables']['player_endorsements']['Row']
export type PlayerReport = Database['public']['Tables']['player_reports']['Row']
export type GameCommunity = Database['public']['Tables']['game_communities']['Row']
export type GameGuide = Database['public']['Tables']['game_guides']['Row']
export type GameSearchEvent = Database['public']['Tables']['game_search_events']['Row']
export type WeeklyRound = Database['public']['Tables']['weekly_rounds']['Row']
export type WeeklyGameCandidate = Database['public']['Tables']['weekly_game_candidates']['Row']
export type WeeklyGameVote = Database['public']['Tables']['weekly_game_votes']['Row']
export type GameEventCommunity = Database['public']['Tables']['game_event_communities']['Row']
export type GameEventCommunityMember = Database['public']['Tables']['game_event_community_members']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventParticipant = Database['public']['Tables']['event_participants']['Row']
export type EventGuide = Database['public']['Tables']['event_guides']['Row']

