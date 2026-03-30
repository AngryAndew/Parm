export type RecipeId = string;
export type UserId = string;

export type Ingredient = {
    name: string;
    amount: string;
};

export type Recipe = {
    recipeId: RecipeId;
    userId: UserId;
    title: string;
    date: string;
    description: string;
    ingredients: Ingredient[];
    directions: string[];
    tags: string[];
    servings: string;
    prepTime: string;
    cookTime: string;
    imageKey?: string;
    createdAt: string;
};
