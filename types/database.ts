export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          contact: string
          story: string
          role: string | null
          experience: string | null
          is_approved: boolean
          music: string | null
          games: string | null
          bio: string | null
          soki_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact: string
          story: string
          role?: string | null
          experience?: string | null
          is_approved?: boolean
          music?: string | null
          games?: string | null
          bio?: string | null
          soki_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact?: string
          story?: string
          role?: string | null
          experience?: string | null
          is_approved?: boolean
          music?: string | null
          games?: string | null
          bio?: string | null
          soki_balance?: number
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
        }
      }
    }
  }
}
