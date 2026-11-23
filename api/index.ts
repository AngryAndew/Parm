import { requireAuth } from "./auth/requireAuth";
import { putRecipe as putRecipeHandler } from "./endpoint/putRecipe";
import { importRecipe as importRecipeHandler } from "./endpoint/importRecipe";
import { getUploadUrl as getUploadUrlHandler } from "./endpoint/getUploadUrl";
import { getRecipes as getRecipesHandler } from "./endpoint/getRecipes";

// Every endpoint requires a signed-in user (Cognito access token).
export const putRecipe = requireAuth(putRecipeHandler);
export const importRecipe = requireAuth(importRecipeHandler);
export const getUploadUrl = requireAuth(getUploadUrlHandler);
export const getRecipes = requireAuth(getRecipesHandler);
