-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_designs table for storing user designs
CREATE TABLE public.saved_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Design',
  sketch_data JSONB,
  typography_system JSONB,
  color_palette JSONB,
  generated_ui JSONB,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_designs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user
CREATE OR REPLACE FUNCTION public.is_current_user(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = check_user_id
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (public.is_current_user(user_id));

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (public.is_current_user(user_id));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (public.is_current_user(user_id));

-- Saved designs RLS policies
CREATE POLICY "Users can view own designs"
ON public.saved_designs FOR SELECT
USING (public.is_current_user(user_id));

CREATE POLICY "Users can insert own designs"
ON public.saved_designs FOR INSERT
WITH CHECK (public.is_current_user(user_id));

CREATE POLICY "Users can update own designs"
ON public.saved_designs FOR UPDATE
USING (public.is_current_user(user_id));

CREATE POLICY "Users can delete own designs"
ON public.saved_designs FOR DELETE
USING (public.is_current_user(user_id));

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_saved_designs_updated_at
BEFORE UPDATE ON public.saved_designs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_saved_designs_user_id ON public.saved_designs(user_id);
CREATE INDEX idx_saved_designs_created_at ON public.saved_designs(created_at DESC);