-- Create time_records table
CREATE TABLE IF NOT EXISTS time_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT,
    timein TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    timeout TIMESTAMP WITH TIME ZONE,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create status_history table
CREATE TABLE IF NOT EXISTS status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES profiles(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_records_user_id ON time_records(user_id);
CREATE INDEX IF NOT EXISTS idx_time_records_timein ON time_records(timein);
CREATE INDEX IF NOT EXISTS idx_status_history_employee_id ON status_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON status_history(changed_at);

-- Add RLS policies
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Time records policies
CREATE POLICY "Employees can view their own time records"
    ON time_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all time records"
    ON time_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Employees can create their own time records"
    ON time_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employees can update their own time records"
    ON time_records FOR UPDATE
    USING (auth.uid() = user_id);

-- Status history policies
CREATE POLICY "Employees can view their own status history"
    ON status_history FOR SELECT
    USING (auth.uid() = employee_id);

CREATE POLICY "Admins can view all status history"
    ON status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can create status history"
    ON status_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_time_records_updated_at
    BEFORE UPDATE ON time_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 