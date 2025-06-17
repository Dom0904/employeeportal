-- Check if id_number column exists before adding it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'id_number'
    ) THEN
        ALTER TABLE profiles ADD COLUMN id_number TEXT;
    END IF;
END $$;

-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_profiles_id_number;

-- Create index for better query performance
CREATE INDEX idx_profiles_id_number ON profiles(id_number);

-- Add comment to explain the column
COMMENT ON COLUMN profiles.id_number IS 'Employee ID number used for login'; 