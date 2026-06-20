-- Create notifications table for audit trail
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('scheduled', 'published', 'overdue')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: admins can read all notifications
CREATE POLICY "Admins can read notifications" ON public.notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = (auth.uid())::text
      AND members.admin = true
    )
  );

-- Create index for queries
CREATE INDEX idx_notifications_type_created ON public.notifications(type, created_at DESC);
CREATE INDEX idx_notifications_recipient_created ON public.notifications(recipient_email, created_at DESC);
