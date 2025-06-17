-- Add id_number column to profiles table
ALTER TABLE profiles
ADD COLUMN id_number TEXT;

-- Add index for better query performance
CREATE INDEX idx_profiles_id_number ON profiles(id_number);

-- Add comment to explain the column
COMMENT ON COLUMN profiles.id_number IS 'Employee ID number used for login'; 