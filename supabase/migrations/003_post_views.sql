-- post_views: track views for blog posts
CREATE TABLE IF NOT EXISTS public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  viewer_ip text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON public.post_views(viewed_at);

-- Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (admin reads)
CREATE POLICY "service role read post_views" ON public.post_views FOR SELECT USING (true);

-- Create a view for post view counts
CREATE OR REPLACE VIEW public.post_view_counts AS
SELECT 
  post_id,
  COUNT(*) as view_count
FROM public.post_views
GROUP BY post_id;

-- Function to increment post views
CREATE OR REPLACE FUNCTION public.increment_post_view(
  p_post_id uuid,
  p_viewer_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.post_views (post_id, viewer_ip, user_agent)
  VALUES (p_post_id, p_viewer_ip, p_user_agent);
END;
$$;
