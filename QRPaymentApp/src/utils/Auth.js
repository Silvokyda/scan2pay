import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the Auth Context
const AuthContext = createContext(null);

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Logout function that can be used throughout the app
  const logout = async (navigation) => {
    try {
      await AsyncStorage.clear();
      setUser(null);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Login function
  const login = async (userData, token) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  // Check if user is logged in
  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking auth state:', error);
      return false;
    }
  };

  const authContextValue = {
    user,
    login,
    logout,
    checkAuthState,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};