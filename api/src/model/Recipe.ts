export type RecipeId = string;
export type UserId = string;

export type Ingredient = {
    name: string,
    amount: string
};

export type Recipe = {
    userId: UserId,
    recipeId: RecipeId,
    title: string,
    date: string,              // YYYY-MM-DD the recipe was made/added
    ingredients: Ingredient[],
    directions: string[],
    sourceUrl?: string,        // set when imported from a website
    imageKey?: string,         // S3 key of the photo (photos are not stored in DynamoDB)
    createdAt: string,         // ISO timestamps
    updatedAt: string
};
