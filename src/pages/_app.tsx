import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { BOMProvider } from '../contexts/BOMContext';
// Add other providers as needed

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <InventoryProvider>
        <BOMProvider>
          {/* Add more providers here if needed */}
          <Component {...pageProps} />
        </BOMProvider>
      </InventoryProvider>
    </AuthProvider>
  );
}

export default MyApp;
