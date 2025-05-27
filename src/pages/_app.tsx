import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { BOMProvider } from '../contexts/BOMContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { JobProvider } from '../contexts/JobContext';
import { LeaveProvider } from '../contexts/LeaveContext';
// Add other providers as needed

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NotificationProvider>
      <AuthProvider>
        <JobProvider>
          <LeaveProvider>
            <InventoryProvider>
              <BOMProvider>
                {/* Add more providers here if needed */}
                <Component {...pageProps} />
              </BOMProvider>
            </InventoryProvider>
          </LeaveProvider>
        </JobProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default MyApp;
