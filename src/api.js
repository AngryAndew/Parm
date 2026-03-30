import axios from "axios";

const PUT_URL = process.env.REACT_APP_LAMBDA_URL || "";
const GET_URL = process.env.REACT_APP_GET_RECIPES_LAMBDA_URL || "";
const DELETE_URL = process.env.REACT_APP_DELETE_RECIPE_LAMBDA_URL || "";
const UPDATE_URL = process.env.REACT_APP_UPDATE_RECIPE_LAMBDA_URL || "";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const apiGetRecipes = (token) =>
  axios.get(GET_URL, { headers: authHeaders(token) }).then((r) => r.data);

export const apiPutRecipe = (recipe, token) =>
  axios.post(PUT_URL, recipe, { headers: authHeaders(token) }).then((r) => r.data);

export const apiUpdateRecipe = (recipe, token) =>
  axios.post(UPDATE_URL, recipe, { headers: authHeaders(token) }).then((r) => r.data);

export const apiDeleteRecipe = (userId, recipeId, token) =>
  axios.post(DELETE_URL, { userId, recipeId }, { headers: authHeaders(token) }).then((r) => r.data);
