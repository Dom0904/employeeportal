import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { BOMProvider } from '../contexts/BOMContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { JobProvider } from '../contexts/JobContext';
import { LeaveProvider } from '../contexts/LeaveContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';

import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';

console.log('App: _app.tsx loaded');

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const noLayoutRoutes = ['/', '/login'];
  const isNoLayout = noLayoutRoutes.includes(router.pathname);

  console.log('App: Rendering main App component');
  console.log('App: NotificationProvider mounted');
  console.log('App: AuthProvider mounted');
  console.log('App: JobProvider mounted');
  console.log('App: LeaveProvider mounted');
  console.log('App: InventoryProvider mounted');
  console.log('App: BOMProvider mounted');
  console.log('App: ProjectProvider mounted');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <NotificationProvider>
          <AuthProvider>
            <JobProvider>
              <LeaveProvider>
                <InventoryProvider>
                  <BOMProvider>
                    <ProjectProvider>
                      {isNoLayout ? (
                        <Component {...pageProps} />
                      ) : (
                        <Layout>
                          <Component {...pageProps} />
                        </Layout>
                      )}
                    </ProjectProvider>
                  </BOMProvider>
                </InventoryProvider>
              </LeaveProvider>
            </JobProvider>
          </AuthProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
