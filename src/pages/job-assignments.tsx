import dynamic from 'next/dynamic';

const JobAssignmentsPage = dynamic(() => import('./job-assignments-impl'), { ssr: false });
export default JobAssignmentsPage;
