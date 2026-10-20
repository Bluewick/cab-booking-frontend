import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom React hook for consuming authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
