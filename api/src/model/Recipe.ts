export type RecipeId = string;
export type UserId = string;

export type Recipe = {
    recipeId: RecipeId,
    userId: UserId,
    recipeDate: Date,
    cooktime: string,
    servings: number,
    rating: number,
    imageUrl: string,
    s3Location: string,
    ingredients: string[],
    directions: string[]
}