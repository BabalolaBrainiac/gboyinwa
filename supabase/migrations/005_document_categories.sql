-- Document categories for better organization
CREATE TABLE IF NOT EXISTS public.document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#053305',
  icon text DEFAULT 'folder',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

-- Insert default categories
INSERT INTO public.document_categories (name, slug, description, color, icon) VALUES
  ('Pitch Decks', 'pitch-decks', 'Investor and partner pitch presentations', '#F4C430', 'presentation'),
  ('Grant Applications', 'grant-applications', 'Grant proposals and supporting documents', '#053305', 'file-text'),
  ('Financial Reports', 'financial-reports', 'Budgets, financial statements, and projections', '#6C3B8B', 'bar-chart'),
  ('Legal Documents', 'legal-documents', 'Contracts, agreements, and legal paperwork', '#F97316', 'shield'),
  ('Marketing Materials', 'marketing-materials', 'Brochures, flyers, and promotional content', '#10B981', 'megaphone'),
  ('Media Assets', 'media-assets', 'Photos, videos, and audio files', '#3B82F6', 'image'),
  ('Meeting Notes', 'meeting-notes', 'Meeting minutes and notes', '#8B5CF6', 'clipboard'),
  ('General', 'general', 'Miscellaneous documents', '#6B7280', 'folder')
ON CONFLICT (slug) DO NOTHING;

-- Add category_id to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.document_categories(id) ON DELETE SET NULL;

-- Add folder_path for hierarchical organization
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS folder_path text DEFAULT '/';

-- Add file metadata for media files
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON public.documents(folder_path);

-- Enable RLS on categories
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for public read
CREATE POLICY "public read categories" ON public.document_categories FOR SELECT USING (true);

-- Update document policies
DROP POLICY IF EXISTS "documents_select_all" ON public.documents;
CREATE POLICY "documents_select_all" ON public.documents FOR SELECT USING (true);
