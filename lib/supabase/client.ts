import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          billing_address: Json | null
          payment_method: Json | null
          subscription_tier: 'free' | 'pro' | 'business'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
          subscription_current_period_end: string | null
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          payment_method?: Json | null
          subscription_tier?: 'free' | 'pro' | 'business'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          subscription_current_period_end?: string | null
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          payment_method?: Json | null
          subscription_tier?: 'free' | 'pro' | 'business'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          subscription_current_period_end?: string | null
          credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          brand_color: string | null
          logo_url: string | null
          watermark_url: string | null
          settings: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          brand_color?: string | null
          logo_url?: string | null
          watermark_url?: string | null
          settings?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          brand_color?: string | null
          logo_url?: string | null
          watermark_url?: string | null
          settings?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      video_templates: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          name: string
          description: string | null
          template_type: 'intro' | 'outro' | 'transition' | 'text_overlay' | 'custom'
          assets: Json
          settings: Json
          is_public: boolean
          category: string
          tags: string[]
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          name: string
          description?: string | null
          template_type?: 'intro' | 'outro' | 'transition' | 'text_overlay' | 'custom'
          assets?: Json
          settings?: Json
          is_public?: boolean
          category?: string
          tags?: string[]
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          name?: string
          description?: string | null
          template_type?: 'intro' | 'outro' | 'transition' | 'text_overlay' | 'custom'
          assets?: Json
          settings?: Json
          is_public?: boolean
          category?: string
          tags?: string[]
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      video_generations: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          template_id: string | null
          prompt: string
          style: string
          duration: number
          aspect_ratio: '9:16' | '16:9' | '1:1' | '4:5'
          status: 'pending' | 'processing' | 'completed' | 'failed'
          progress: number
          output_url: string | null
          thumbnail_url: string | null
          metadata: Json | null
          error_message: string | null
          credits_used: number
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          template_id?: string | null
          prompt: string
          style: string
          duration: number
          aspect_ratio?: '9:16' | '16:9' | '1:1' | '4:5'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          progress?: number
          output_url?: string | null
          thumbnail_url?: string | null
          metadata?: Json | null
          error_message?: string | null
          credits_used?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          template_id?: string | null
          prompt?: string
          style?: string
          duration?: number
          aspect_ratio?: '9:16' | '16:9' | '1:1' | '4:5'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          progress?: number
          output_url?: string | null
          thumbnail_url?: string | null
          metadata?: Json | null
          error_message?: string | null
          credits_used?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      scheduled_posts: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          video_generation_id: string | null
          platform: 'youtube' | 'instagram' | 'tiktok' | 'email'
          scheduled_time: string
          timezone: string
          status: 'scheduled' | 'posted' | 'failed' | 'canceled'
          post_data: Json
          platform_post_id: string | null
          error_message: string | null
          posted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          video_generation_id?: string | null
          platform: 'youtube' | 'instagram' | 'tiktok' | 'email'
          scheduled_time: string
          timezone: string
          status?: 'scheduled' | 'posted' | 'failed' | 'canceled'
          post_data: Json
          platform_post_id?: string | null
          error_message?: string | null
          posted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          video_generation_id?: string | null
          platform?: 'youtube' | 'instagram' | 'tiktok' | 'email'
          scheduled_time?: string
          timezone?: string
          status?: 'scheduled' | 'posted' | 'failed' | 'canceled'
          post_data?: Json
          platform_post_id?: string | null
          error_message?: string | null
          posted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      platform_connections: {
        Row: {
          id: string
          user_id: string
          platform: 'youtube' | 'instagram' | 'tiktok' | 'email'
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          platform_user_id: string
          platform_user_name: string | null
          platform_user_email: string | null
          profile_picture: string | null
          is_active: boolean
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: 'youtube' | 'instagram' | 'tiktok' | 'email'
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          platform_user_id: string
          platform_user_name?: string | null
          platform_user_email?: string | null
          profile_picture?: string | null
          is_active?: boolean
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: 'youtube' | 'instagram' | 'tiktok' | 'email'
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          platform_user_id?: string
          platform_user_name?: string | null
          platform_user_email?: string | null
          profile_picture?: string | null
          is_active?: boolean
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          user_id: string
          video_generation_id: string | null
          scheduled_post_id: string | null
          platform: 'youtube' | 'instagram' | 'tiktok' | 'email'
          metric_type: 'views' | 'likes' | 'comments' | 'shares' | 'engagement'
          value: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_generation_id?: string | null
          scheduled_post_id?: string | null
          platform: 'youtube' | 'instagram' | 'tiktok' | 'email'
          metric_type: 'views' | 'likes' | 'comments' | 'shares' | 'engagement'
          value: number
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_generation_id?: string | null
          scheduled_post_id?: string | null
          platform?: 'youtube' | 'instagram' | 'tiktok' | 'email'
          metric_type?: 'views' | 'likes' | 'comments' | 'shares' | 'engagement'
          value?: number
          date?: string
          created_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          amount: number
          description: string
          reference_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          amount: number
          description: string
          reference_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'purchase' | 'usage' | 'refund' | 'bonus'
          amount?: number
          description?: string
          reference_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      ai_model_usage: {
        Row: {
          id: string
          user_id: string
          video_generation_id: string
          model_name: string
          tokens_used: number
          cost: number
          duration_ms: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_generation_id: string
          model_name: string
          tokens_used: number
          cost: number
          duration_ms: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_generation_id?: string
          model_name?: string
          tokens_used?: number
          cost?: number
          duration_ms?: number
          created_at?: string
        }
      }
    }
    Views: {
      user_statistics: {
        Row: {
          user_id: string
          total_videos_generated: number
          total_posts_scheduled: number
          total_credits_used: number
          active_platform_connections: number
          last_video_generated: string | null
        }
      }
    }
    Functions: {
      check_user_credits: {
        Args: {
          user_id_param: string
          required_credits: number
        }
        Returns: boolean
      }
      get_daily_usage_stats: {
        Args: {
          user_id_param: string
          start_date: string
          end_date: string
        }
        Returns: {
          date: string
          videos_generated: number
          credits_used: number
          posts_scheduled: number
        }[]
      }
      schedule_video_post: {
        Args: {
          p_user_id: string
          p_video_url: string
          p_platform: string
          p_scheduled_time: string
          p_timezone: string
          p_post_data: Json
        }
        Returns: string
      }
    }
  }
}

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
