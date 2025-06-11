-- Add project_id column to jobs table
ALTER TABLE jobs
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_jobs_project_id ON jobs(project_id);

-- Add comment to explain the column
COMMENT ON COLUMN jobs.project_id IS 'Reference to the project this job belongs to'; 