import React, { createContext, useContext, useState, useEffect } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: process.env.REACT_APP_USER_POOL_ID || "",
  ClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || "",
};

const userPool = poolData.UserPoolId && poolData.ClientId
  ? new CognitoUserPool(poolData)
  : null;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userPool) { setLoading(false); return; }
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) { setLoading(false); return; }
    cognitoUser.getSession((err, session) => {
      if (!err && session.isValid()) {
        cognitoUser.getUserAttributes((attrErr, attrs) => {
          const email = attrs?.find((a) => a.Name === "email")?.Value;
          setUser({ username: cognitoUser.getUsername(), email });
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const signIn = (email, password) =>
    new Promise((resolve, reject) => {
      if (!userPool) return reject(new Error("Cognito not configured"));
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          setUser({ username: cognitoUser.getUsername(), email });
          resolve(session);
        },
        onFailure: reject,
      });
    });

  const signUp = (email, password) =>
    new Promise((resolve, reject) => {
      if (!userPool) return reject(new Error("Cognito not configured"));
      const attrs = [new CognitoUserAttribute({ Name: "email", Value: email })];
      userPool.signUp(email, password, attrs, null, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

  const confirmSignUp = (email, code) =>
    new Promise((resolve, reject) => {
      if (!userPool) return reject(new Error("Cognito not configured"));
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

  const signOut = () => {
    userPool?.getCurrentUser()?.signOut();
    setUser(null);
  };

  const getToken = () =>
    new Promise((resolve, reject) => {
      const cognitoUser = userPool?.getCurrentUser();
      if (!cognitoUser) return resolve(null);
      cognitoUser.getSession((err, session) => {
        if (err) return reject(err);
        resolve(session.getIdToken().getJwtToken());
      });
    });

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, confirmSignUp, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
