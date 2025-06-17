-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    clock_out TIMESTAMP WITH TIME ZONE,
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
CREATE INDEX IF NOT EXISTS idx_time_logs_employee_id ON time_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_clock_in ON time_logs(clock_in);
CREATE INDEX IF NOT EXISTS idx_status_history_employee_id ON status_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON status_history(changed_at);

-- Add RLS policies
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Time logs policies
CREATE POLICY "Employees can view their own time logs"
    ON time_logs FOR SELECT
    USING (auth.uid() = employee_id);

CREATE POLICY "Admins can view all time logs"
    ON time_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Employees can create their own time logs"
    ON time_logs FOR INSERT
    WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update their own time logs"
    ON time_logs FOR UPDATE
    USING (auth.uid() = employee_id);

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

CREATE TRIGGER update_time_logs_updated_at
    BEFORE UPDATE ON time_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 