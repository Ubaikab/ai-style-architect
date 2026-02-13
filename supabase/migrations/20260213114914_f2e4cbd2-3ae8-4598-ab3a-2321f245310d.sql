
CREATE TABLE public.saved_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Design',
  sketch_data JSONB,
  typography_system JSONB,
  color_palette JSONB,
  generated_ui JSONB,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved designs"
ON public.saved_designs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved designs"
ON public.saved_designs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved designs"
ON public.saved_designs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved designs"
ON public.saved_designs FOR DELETE
USING (auth.uid() = user_id);
