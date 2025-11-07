import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserLogin, UserCreate, AuthContextType } from '../types';
import apiService from '../services/api';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await apiService.getUserProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user profile:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials: UserLogin): Promise<void> => {
    try {
      const response = await apiService.login(credentials);
      localStorage.setItem('token', response.access_token);
      setToken(response.access_token);
      
      const userData = await apiService.getUserProfile();
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: UserCreate): Promise<void> => {
    // No-op: registration removed. Perform login which will auto-create user.
    const loginResponse = await apiService.login({ riot_id: userData.riot_id, tag: userData.tag });
    localStorage.setItem('token', loginResponse.access_token);
    setToken(loginResponse.access_token);
    const profile = await apiService.getUserProfile();
    setUser(profile);
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

