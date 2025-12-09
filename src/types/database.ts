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
          joined_at: string
        }
        Insert: {
          id?: string
          lobby_id: string
          user_id: string
          role: 'host' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          lobby_id?: string
          user_id?: string
          role?: 'host' | 'member'
          joined_at?: string
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
export type GameCommunity = Database['public']['Tables']['game_communities']['Row']
export type GameGuide = Database['public']['Tables']['game_guides']['Row']
export type GameSearchEvent = Database['public']['Tables']['game_search_events']['Row']

