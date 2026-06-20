-- Add 'under_consideration' status to posts
-- First, recreate the enum with the new value
ALTER TYPE public.post_status ADD VALUE 'under_consideration' BEFORE 'published';
