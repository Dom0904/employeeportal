-- Alter employee_list table to use profile_id as foreign key and remove duplicated columns

-- Add profile_id column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_list' AND column_name = 'profile_id') THEN
        ALTER TABLE public.employee_list ADD COLUMN profile_id UUID;
    END IF;
END
$$;

-- Update existing rows to populate profile_id from id
UPDATE public.employee_list
SET profile_id = id
WHERE profile_id IS NULL;

-- Add foreign key constraint and ensure profile_id is not null
ALTER TABLE public.employee_list
ALTER COLUMN profile_id SET NOT NULL;

ALTER TABLE public.employee_list
ADD CONSTRAINT fk_profile_id
FOREIGN KEY (profile_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Remove duplicated columns that should come from the profiles table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_list' AND column_name = 'id_number') THEN
        ALTER TABLE public.employee_list DROP COLUMN id_number;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_list' AND column_name = 'name') THEN
        ALTER TABLE public.employee_list DROP COLUMN name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_list' AND column_name = 'email') THEN
        ALTER TABLE public.employee_list DROP COLUMN email;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_list' AND column_name = 'phone_number') THEN
        ALTER TABLE public.employee_list DROP COLUMN phone_number;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_list' AND column_name = 'role') THEN
        ALTER TABLE public.employee_list DROP COLUMN role;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_list' AND column_name = 'profile_picture') THEN
        ALTER TABLE public.employee_list DROP COLUMN profile_picture;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_list' AND column_name = 'date_hired') THEN
        ALTER TABLE public.employee_list DROP COLUMN date_hired;
    END IF;
END
$$;

-- Make id column no longer primary key (if it was) and then drop it if it is redundant with profile_id
-- We will assume `id` in employee_list now points to `profile_id`
-- If `id` is still a unique identifier needed for employee_list itself, we would keep it.
-- Given the goal of mirroring profiles data, `profile_id` should serve as the main identifier here.
-- First, if `id` is a primary key, remove that constraint.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.employee_list'::regclass
        AND contype = 'p'
    ) THEN
        ALTER TABLE public.employee_list DROP CONSTRAINT employee_list_pkey; -- Adjust constraint name if different
    END IF;
END
$$;

-- Now, set profile_id as the primary key
ALTER TABLE public.employee_list
ADD CONSTRAINT employee_list_pkey PRIMARY KEY (profile_id);

-- Optionally, drop the old 'id' column if it's no longer needed after copying its values to 'profile_id'
-- This depends on whether 'id' was solely for linking to profiles or had its own purpose for employee_list.
-- Based on the mirroring, it seems redundant.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_list' AND column_name = 'id') THEN
        ALTER TABLE public.employee_list DROP COLUMN id;
    END IF;
END
$$; 