import axios from "axios";

// Axios client for our Lambdas. Adds the signed-in user's Cognito access token.
// (Don't use this for the S3 photo upload: signed S3 URLs reject extra auth headers.)
const api = axios.create({ headers: { "Content-Type": "application/json" } });

let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export default api;
