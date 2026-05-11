-- SOKIWRLD Database Setup Script
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table with SOKI balance
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact TEXT NOT NULL,
  story TEXT NOT NULL,
  role TEXT,
  experience TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  music TEXT,
  games TEXT,
  bio TEXT,
  soki_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table for discussions
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table for nested discussions
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_contact ON profiles(contact);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Posts RLS policies
CREATE POLICY "Users can view approved posts" ON posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_approved = true
        )
    );

CREATE POLICY "Approved users can insert posts" ON posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_approved = true
        )
    );

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Comments RLS policies
CREATE POLICY "Users can view approved comments" ON comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_approved = true
        )
    );

CREATE POLICY "Approved users can insert comments" ON comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_approved = true
        )
    );

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = author_id);

-- Create view for posts with author info
CREATE OR REPLACE VIEW posts_with_author AS
SELECT 
    posts.*,
    profiles.contact as author_contact,
    profiles.role as author_role
FROM posts
LEFT JOIN profiles ON posts.author_id = profiles.id;

-- Create view for comments with author info
CREATE OR REPLACE VIEW comments_with_author AS
SELECT 
    comments.*,
    profiles.contact as author_contact,
    profiles.role as author_role
FROM comments
LEFT JOIN profiles ON comments.author_id = profiles.id;

-- Function to get comment count for posts
CREATE OR REPLACE FUNCTION get_post_comment_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM comments 
        WHERE post_id = post_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Sample data (optional - remove for production)
-- INSERT INTO profiles (id, contact, story, role, experience, is_approved, soki_balance) VALUES
-- (uuid_generate_v4(), 'admin', 'System administrator', 'creator', 'Full stack developer', true, 1000);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON posts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON comments TO authenticated;
GRANT USAGE ON ALL SEQUENCES TO authenticated;

-- Grant permissions to service role (for admin operations)
GRANT ALL ON profiles TO service_role;
GRANT ALL ON posts TO service_role;
GRANT ALL ON comments TO service_role;

-- Grant select on views
GRANT SELECT ON posts_with_author TO authenticated;
GRANT SELECT ON comments_with_author TO authenticated;
GRANT SELECT ON posts_with_author TO service_role;
GRANT SELECT ON comments_with_author TO service_role;
