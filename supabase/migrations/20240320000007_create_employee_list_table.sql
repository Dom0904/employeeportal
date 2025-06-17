-- Create employee_list table
CREATE TABLE IF NOT EXISTS public.employee_list (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    department TEXT DEFAULT 'General',
    position TEXT,
    status TEXT DEFAULT 'Active',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_list_profile_id ON public.employee_list (profile_id);
CREATE INDEX IF NOT EXISTS idx_employee_list_department ON public.employee_list (department);
CREATE INDEX IF NOT EXISTS idx_employee_list_status ON public.employee_list (status);
CREATE INDEX IF NOT EXISTS idx_employee_list_last_active ON public.employee_list (last_active);

-- Row Level Security (RLS)
ALTER TABLE public.employee_list ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own records
CREATE POLICY IF NOT EXISTS "Authenticated users can view their own employee list record."
ON public.employee_list FOR SELECT
USING (auth.uid() = profile_id);

-- Policy for admins to manage all records
CREATE POLICY IF NOT EXISTS "Admins can manage all employee list records."
ON public.employee_list FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_employee_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_list_updated_at_trigger
BEFORE UPDATE ON public.employee_list
FOR EACH ROW
EXECUTE FUNCTION update_employee_list_updated_at();

-- Insert existing profiles into employee_list if not already present
INSERT INTO public.employee_list (profile_id, department, position, status, last_active, created_at, updated_at)
SELECT
    p.id,
    p.department,
    p.position,
    'Active', -- Default status for existing profiles
    COALESCE(p.last_active, NOW()),
    p.created_at,
    NOW()
FROM
    public.profiles AS p
ON CONFLICT (profile_id) DO NOTHING;
