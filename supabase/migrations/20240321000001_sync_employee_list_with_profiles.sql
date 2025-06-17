-- Ensure all profiles have corresponding entries in employee_list
INSERT INTO public.employee_list (profile_id, department, position, status, created_at, updated_at)
SELECT
    p.id,
    COALESCE(p.department, 'General'),
    COALESCE(p.position, ''),
    'Active',
    NOW(),
    NOW()
FROM
    public.profiles AS p
LEFT JOIN
    public.employee_list AS el ON p.id = el.profile_id
WHERE
    el.profile_id IS NULL;

-- Add comment to explain the purpose of this migration
COMMENT ON TABLE public.employee_list IS 'Employee list table that links to profiles and contains additional employee-specific information'; 