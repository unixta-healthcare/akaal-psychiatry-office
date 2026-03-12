/**
 * Supabase Database type definitions for Akaal Psychiatry (unixta-production).
 * Covers the two project-specific tables.
 *
 * To regenerate automatically: npx supabase gen types typescript --project-id YOUR_ID
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      akaal_psychiatry_admin_users: {
        Row: {
          id: number;
          email: string;
          name: string;
          picture: string | null;
          role: 'super_admin' | 'admin' | 'staff' | 'readonly';
          is_active: boolean;
          last_login_at: string | null;
          google_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          email: string;
          name?: string;
          picture?: string | null;
          role?: 'super_admin' | 'admin' | 'staff' | 'readonly';
          is_active?: boolean;
          last_login_at?: string | null;
          google_id?: string | null;
        };
        Update: {
          name?: string;
          picture?: string | null;
          role?: 'super_admin' | 'admin' | 'staff' | 'readonly';
          is_active?: boolean;
          last_login_at?: string | null;
          google_id?: string | null;
        };
        Relationships: [];
      };
      akaal_psychiatry_blog_posts: {
        Row: {
          id: number;
          slug: string;
          title: string;
          excerpt: string;
          content: string;
          author: string;
          category: string;
          tags: string[];
          image: string | null;
          meta_description: string;
          read_time: string;
          featured: boolean;
          published: boolean;
          publish_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          title: string;
          excerpt?: string;
          content?: string;
          author?: string;
          category?: string;
          tags?: string[];
          image?: string | null;
          meta_description?: string;
          read_time?: string;
          featured?: boolean;
          published?: boolean;
          publish_date?: string | null;
          created_by?: string | null;
        };
        Update: {
          slug?: string;
          title?: string;
          excerpt?: string;
          content?: string;
          author?: string;
          category?: string;
          tags?: string[];
          image?: string | null;
          meta_description?: string;
          read_time?: string;
          featured?: boolean;
          published?: boolean;
          publish_date?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

