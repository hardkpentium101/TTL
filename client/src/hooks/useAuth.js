import { useAuth0 } from '@auth0/auth0-react';
import { api, getOrCreateUser } from '../utils/api';

/**
 * Custom hook for authentication
 * Provides auth state, login, logout, and token management
 */
export function useAuth() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    loginWithRedirect, 
    logout,
    getAccessTokenSilently,
    getAccessTokenWithPopup,
  } = useAuth0();

  /**
   * Login with Auth0
   */
  const login = async (options = {}) => {
    await loginWithRedirect({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      },
      ...options,
    });
  };

  /**
   * Logout and clear local session
   */
  const signOut = async () => {
    // Clear local storage
    localStorage.removeItem('auth0_token');
    
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    });
  };

  /**
   * Get access token for API calls
   */
  const getToken = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      });
      // Store token for API interceptor
      localStorage.setItem('auth0_token', token);
      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      // Try popup as fallback
      try {
        const token = await getAccessTokenWithPopup({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          },
        });
        localStorage.setItem('auth0_token', token);
        return token;
      } catch (popupError) {
        console.error('Failed to get token with popup:', popupError);
        return null;
      }
    }
  };

  /**
   * Sync user with backend database
   */
  const syncUser = async () => {
    console.log('syncUser called, isAuthenticated:', isAuthenticated, 'user:', user);
    if (!isAuthenticated) return null;
    
    try {
      await getToken(); // Ensure token is available
      console.log('Calling getOrCreateUser API...');
      const result = await getOrCreateUser();
      console.log('getOrCreateUser result:', result);
      return result.user;
    } catch (error) {
      console.error('Failed to sync user:', error);
      return null;
    }
  };

  return {
    // Auth state
    isAuthenticated,
    isLoading,
    user,
    
    // Actions
    login,
    logout: signOut,
    getToken,
    syncUser,
    
    // Direct Auth0 methods (if needed)
    getAccessTokenSilently,
    getAccessTokenWithPopup,
  };
}
