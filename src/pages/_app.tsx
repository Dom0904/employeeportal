import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { BOMProvider } from '../contexts/BOMContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { JobProvider } from '../contexts/JobContext';
import { LeaveProvider } from '../contexts/LeaveContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';

import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const noLayoutRoutes = ['/', '/login'];
  const isNoLayout = noLayoutRoutes.includes(router.pathname);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <AuthProvider>
          <JobProvider>
            <LeaveProvider>
              <InventoryProvider>
                <BOMProvider>
                  {isNoLayout ? (
                    <Component {...pageProps} />
                  ) : (
                    <Layout>
                      <Component {...pageProps} />
                    </Layout>
                  )}
                </BOMProvider>
              </InventoryProvider>
            </LeaveProvider>
          </JobProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
