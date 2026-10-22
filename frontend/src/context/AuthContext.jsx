import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';

export const AuthContext = createContext(null);
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    authApi
      .session()
      .then((data) => {
        if (active) setSession(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    function expire() {
      setSession(null);
    }
    window.addEventListener('vert-session-expired', expire);
    return () => {
      active = false;
      window.removeEventListener('vert-session-expired', expire);
    };
  }, []);
  async function login(values) {
    await authApi.session();
    const data = await authApi.login(values);
    if (!data.user) throw new Error('Sign-in was not confirmed by Django.');
    setSession(data);
    setError('');
  }
  async function logout() {
    await authApi.logout();
    setSession(null);
  }
  return (
    <AuthContext.Provider
      value={{
        user: session?.user,
        permissions: session?.permissions || {},
        loginLabel: session?.login_label || 'Account identifier',
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
