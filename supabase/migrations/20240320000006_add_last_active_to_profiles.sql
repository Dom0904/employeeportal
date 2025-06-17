-- Add last_active column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'last_active'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);

-- Add comment to explain the column
COMMENT ON COLUMN profiles.last_active IS 'Last time the user was active in the system';

-- Update existing rows to have last_active set to now
UPDATE profiles SET last_active = NOW() WHERE last_active IS NULL; 