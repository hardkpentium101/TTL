import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;
const REDIRECT_URI = window.location.origin;

export default function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate();

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    console.warn('Auth0 not configured - running without authentication');
    return children;
  }

  const configuration = {
    domain: AUTH0_DOMAIN,
    clientId: AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: REDIRECT_URI,
      audience: AUTH0_AUDIENCE,
    },
    onRedirectCallback,
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
  };

  return (
    <Auth0Provider {...configuration}>
      {children}
    </Auth0Provider>
  );
}
