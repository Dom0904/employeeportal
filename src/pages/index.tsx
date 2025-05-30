import { AuthProvider } from '../contexts/AuthContext';
import Login from './Login';

export default function Home() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}
