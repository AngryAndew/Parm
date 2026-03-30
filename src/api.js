import axios from "axios";

const PUT_URL = process.env.REACT_APP_LAMBDA_URL || "";
const GET_URL = process.env.REACT_APP_GET_RECIPES_LAMBDA_URL || "";
const DELETE_URL = process.env.REACT_APP_DELETE_RECIPE_LAMBDA_URL || "";
const UPDATE_URL = process.env.REACT_APP_UPDATE_RECIPE_LAMBDA_URL || "";

const headers = { "Content-Type": "application/json" };

export const apiGetRecipes = () => axios.get(GET_URL).then((r) => r.data);

export const apiPutRecipe = (recipe) => axios.post(PUT_URL, recipe, { headers }).then((r) => r.data);

export const apiUpdateRecipe = (recipe) => axios.post(UPDATE_URL, recipe, { headers }).then((r) => r.data);

export const apiDeleteRecipe = (userId, recipeId) =>
  axios.post(DELETE_URL, { userId, recipeId }, { headers }).then((r) => r.data);
