-- Add department column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'department'
    ) THEN
        ALTER TABLE profiles ADD COLUMN department TEXT DEFAULT 'General';
    END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);

-- Add comment to explain the column
COMMENT ON COLUMN profiles.department IS 'Employee department or division'; 