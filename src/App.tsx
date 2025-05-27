import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from './contexts/AuthContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { NotificationProvider, NotificationSnackbar } from './contexts/NotificationContext';
import { JobProvider } from './contexts/JobContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { LeaveProvider } from './contexts/LeaveContext';
import { BOMProvider } from './contexts/BOMContext';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PersonalInfo from './pages/PersonalInfo';
import EmployeeList from './pages/EmployeeList';
import EmployeeStatus from './pages/EmployeeStatus';
import JobSchedule from './pages/JobSchedule';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import Announcements from './pages/Announcements';
import LeaveRequests from './pages/LeaveRequests';
import Inventory from './pages/Inventory';
import CostEstimation from './pages/CostEstimation';
import BillOfMaterial from './pages/BillOfMaterial';
import TimeTracking from './pages/TimeTracking';
import JobAssignments from './pages/JobAssignments';
import JobAcknowledgement from './pages/JobAcknowledgement';

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if user has required role
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <NotificationProvider>
        <JobProvider>
          <InventoryProvider>
            <LeaveProvider>
              <BOMProvider>
                <NotificationSnackbar />
                <Routes>
                <Route path="/login" element={
                  isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                } />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  {/* Dashboard is the main page after login */}
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  {/* Personal Info (accessible by all) */}
                  <Route path="profile" element={<PersonalInfo />} />
                  {/* Employee List (admin only) */}
                  <Route path="employees" element={
                    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                      <EmployeeList />
                    </ProtectedRoute>
                  } />
                  {/* Employee Status (admin, moderator with view-only) */}
                  <Route path="employee-status" element={
                    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MODERATOR]}>
                      <EmployeeStatus />
                    </ProtectedRoute>
                  } />
                  {/* Job Schedule (all except regular users) */}
                  <Route path="job-schedule" element={
                    <ProtectedRoute>
                      <JobSchedule />
                    </ProtectedRoute>
                  } />
                  {/* Calendar (all users) */}
                  <Route path="calendar" element={<Calendar />} />
                  {/* Settings (all users) */}
                  <Route path="settings" element={<Settings />} />
                  {/* Announcements (all users) */}
                  <Route path="announcements" element={<Announcements />} />
                  {/* Leave Requests (all users) */}
                  <Route path="leave-requests" element={<LeaveRequests />} />
                  {/* Job Acknowledgement (all users) */}
                  <Route path="job-acknowledgement" element={<JobAcknowledgement />} />
                  {/* Inventory (all users) */}
                  <Route path="inventory" element={<Inventory />} />
                  {/* Cost Estimation (all except regular users) */}
                  <Route path="cost-estimation" element={
                    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER]}>
                      <CostEstimation />
                    </ProtectedRoute>
                  } />
                  {/* Bill of Material (all users) */}
                  <Route path="bill-of-materials" element={<BillOfMaterial />} />
                  {/* Time Tracking (all users) */}
                  <Route path="time-tracking" element={<TimeTracking />} />
                  {/* Job Assignments (all users) */}
                  <Route path="job-assignments" element={<JobAssignments />} />
                </Route>
                {/* Redirect all other routes to dashboard if authenticated, or login if not */}
                <Route path="*" element={
                  isAuthenticated ?
                    <Navigate to="/dashboard" replace /> :
                    <Navigate to="/login" replace />
                } />
              </Routes>
            </BOMProvider>
            </LeaveProvider>
          </InventoryProvider>
        </JobProvider>
      </NotificationProvider>
    </LocalizationProvider>
  );
}

export default App;