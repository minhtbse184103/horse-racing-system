import { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthContext = createContext(null);

/**
 * AuthProvider: bọc toàn bộ app để chia sẻ auth state
 */
export function AuthProvider({ children }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * useAuthState: dùng trong bất kỳ component nào cần auth
 */
export function useAuthState() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthState phải được dùng bên trong <AuthProvider>');
  }
  return ctx;
}
