-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    billing_address JSONB,
    payment_method JSONB,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business')),
    subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
    subscription_current_period_end TIMESTAMP WITH TIME ZONE,
    credits INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    brand_color TEXT,
    logo_url TEXT,
    watermark_url TEXT,
    settings JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Video Templates table
CREATE TABLE IF NOT EXISTS public.video_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT CHECK (template_type IN ('intro', 'outro', 'transition', 'text_overlay', 'custom')),
    assets JSONB NOT NULL DEFAULT '{}'::jsonb,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Video Generations table
CREATE TABLE IF NOT EXISTS public.video_generations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.video_templates(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    style TEXT NOT NULL,
    duration INTEGER NOT NULL,
    aspect_ratio TEXT DEFAULT '9:16' CHECK (aspect_ratio IN ('9:16', '16:9', '1:1', '4:5')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0,
    output_url TEXT,
    thumbnail_url TEXT,
    metadata JSONB,
    error_message TEXT,
    credits_used INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Scheduled Posts table
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    video_generation_id UUID REFERENCES public.video_generations(id) ON DELETE SET NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'email')),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed', 'canceled')),
    post_data JSONB NOT NULL,
    platform_post_id TEXT,
    error_message TEXT,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Platform Connections table
CREATE TABLE IF NOT EXISTS public.platform_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'email')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    platform_user_id TEXT NOT NULL,
    platform_user_name TEXT,
    platform_user_email TEXT,
    profile_picture TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, platform)
);

-- Analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    video_generation_id UUID REFERENCES public.video_generations(id) ON DELETE SET NULL,
    scheduled_post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'email')),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('views', 'likes', 'comments', 'shares', 'engagement')),
    value INTEGER NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Credit Transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- AI Model Usage table
CREATE TABLE IF NOT EXISTS public.ai_model_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    video_generation_id UUID REFERENCES public.video_generations(id) ON DELETE CASCADE NOT NULL,
    model_name TEXT NOT NULL,
    tokens_used INTEGER NOT NULL,
    cost DECIMAL(10,4) NOT NULL,
    duration_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON public.video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_status ON public.video_generations(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_time ON public.scheduled_posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_platform_connections_user_id ON public.platform_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id_date ON public.analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_usage ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Video Templates policies
CREATE POLICY "Users can view own templates" ON public.video_templates
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own templates" ON public.video_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.video_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.video_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Video Generations policies
CREATE POLICY "Users can view own video generations" ON public.video_generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video generations" ON public.video_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video generations" ON public.video_generations
    FOR UPDATE USING (auth.uid() = user_id);

-- Scheduled Posts policies
CREATE POLICY "Users can view own scheduled posts" ON public.scheduled_posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled posts" ON public.scheduled_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled posts" ON public.scheduled_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled posts" ON public.scheduled_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Platform Connections policies
CREATE POLICY "Users can view own platform connections" ON public.platform_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own platform connections" ON public.platform_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own platform connections" ON public.platform_connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own platform connections" ON public.platform_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR SELECT USING (auth.uid() = user_id);

-- Credit Transactions policies
CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- AI Model Usage policies
CREATE POLICY "Users can view own AI model usage" ON public.ai_model_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Functions

-- Function to check if user has enough credits
CREATE OR REPLACE FUNCTION check_user_credits(
    user_id_param UUID,
    required_credits INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    available_credits INTEGER;
BEGIN
    SELECT credits INTO available_credits
    FROM public.users
    WHERE id = user_id_param;
    
    RETURN COALESCE(available_credits, 0) >= required_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily usage statistics
CREATE OR REPLACE FUNCTION get_daily_usage_stats(
    user_id_param UUID,
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    date DATE,
    videos_generated BIGINT,
    credits_used BIGINT,
    posts_scheduled BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.date,
        COALESCE(vg.count, 0)::BIGINT AS videos_generated,
        COALESCE(ct.credits, 0)::BIGINT AS credits_used,
        COALESCE(sp.count, 0)::BIGINT AS posts_scheduled
    FROM generate_series(start_date, end_date, '1 day'::interval) d(date)
    LEFT JOIN (
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM public.video_generations
        WHERE user_id = user_id_param
        GROUP BY DATE(created_at)
    ) vg ON d.date = vg.date
    LEFT JOIN (
        SELECT DATE(created_at) AS date, SUM(amount) AS credits
        FROM public.credit_transactions
        WHERE user_id = user_id_param AND type = 'usage'
        GROUP BY DATE(created_at)
    ) ct ON d.date = ct.date
    LEFT JOIN (
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM public.scheduled_posts
        WHERE user_id = user_id_param
        GROUP BY DATE(created_at)
    ) sp ON d.date = sp.date
    ORDER BY d.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule video post
CREATE OR REPLACE FUNCTION schedule_video_post(
    p_user_id UUID,
    p_video_url TEXT,
    p_platform TEXT,
    p_scheduled_time TIMESTAMP WITH TIME ZONE,
    p_timezone TEXT,
    p_post_data JSONB
)
RETURNS UUID AS $$
DECLARE
    new_post_id UUID;
BEGIN
    INSERT INTO public.scheduled_posts (
        user_id,
        platform,
        scheduled_time,
        timezone,
        post_data
    ) VALUES (
        p_user_id,
        p_platform,
        p_scheduled_time,
        p_timezone,
        p_post_data
    ) RETURNING id INTO new_post_id;
    
    RETURN new_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_templates_updated_at BEFORE UPDATE ON public.video_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_generations_updated_at BEFORE UPDATE ON public.video_generations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON public.scheduled_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_connections_updated_at BEFORE UPDATE ON public.platform_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT
    u.id AS user_id,
    COUNT(DISTINCT vg.id) AS total_videos_generated,
    COUNT(DISTINCT sp.id) AS total_posts_scheduled,
    COALESCE(SUM(ct.amount) FILTER (WHERE ct.type = 'usage'), 0) AS total_credits_used,
    COUNT(DISTINCT pc.id) FILTER (WHERE pc.is_active = true) AS active_platform_connections,
    MAX(vg.created_at) AS last_video_generated
FROM public.users u
LEFT JOIN public.video_generations vg ON u.id = vg.user_id
LEFT JOIN public.scheduled_posts sp ON u.id = sp.user_id
LEFT JOIN public.credit_transactions ct ON u.id = ct.user_id
LEFT JOIN public.platform_connections pc ON u.id = pc.user_id
GROUP BY u.id;

-- Insert default public templates
INSERT INTO public.video_templates (
    id,
    user_id,
    name,
    description,
    template_type,
    assets,
    settings,
    is_public,
    category,
    tags
) VALUES
(
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000000', -- System user
    'Modern Intro',
    'Clean modern intro template for videos',
    'intro',
    '{"music": "intro_music.mp3", "fonts": ["Inter", "Roboto"]}'::jsonb,
    '{"duration": 5, "fps": 30, "resolution": "1080x1920"}'::jsonb,
    true,
    'Intro',
    ARRAY['modern', 'clean', 'professional']
),
(
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000000',
    'TikTok Style',
    'Template optimized for TikTok platform',
    'custom',
    '{"transitions": ["slide", "fade"], "effects": ["glitch"]}'::jsonb,
    '{"duration": 60, "fps": 60, "resolution": "1080x1920"}'::jsonb,
    true,
    'Social Media',
    ARRAY['tiktok', 'trending', 'viral']
);
