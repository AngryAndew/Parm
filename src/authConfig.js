import { WebStorageStateStore } from "oidc-client-ts";

// Values come from the AuthStack outputs after `cdk deploy AuthStack`.
export const cognitoDomain = process.env.REACT_APP_COGNITO_DOMAIN || "";
export const cognitoClientId = process.env.REACT_APP_COGNITO_CLIENT_ID || "";

export const oidcConfig = {
  authority: process.env.REACT_APP_COGNITO_AUTHORITY || "",
  client_id: cognitoClientId,
  redirect_uri: `${window.location.origin}/`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  response_type: "code",
  scope: "openid email profile",
  // Stay signed in across browser restarts (refresh token lasts 30 days).
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // Remove ?code=...&state=... from the address bar after login.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

// Cognito doesn't support the standard OIDC end-session endpoint, so log out via its own URL.
export const cognitoLogoutUrl = () =>
  `${cognitoDomain}/logout?client_id=${encodeURIComponent(cognitoClientId)}&logout_uri=${encodeURIComponent(
    `${window.location.origin}/`
  )}`;
