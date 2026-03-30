import { DynamoDBClient, PutItemCommand, DeleteItemCommand, ScanCommand, AttributeValue } from "@aws-sdk/client-dynamodb";
import { Ingredient, Recipe } from "../model/Recipe";

export class DynamoDbProxy {
    private client: DynamoDBClient;
    private recipeTableName: string;

    constructor(region: string) {
        this.client = new DynamoDBClient({ region });
        this.recipeTableName = process.env.RECIPE_TABLE_NAME ?? (() => { throw new Error("RECIPE_TABLE_NAME env var is not set"); })();
    }

    private toAttr(value: any): AttributeValue {
        if (value === null || value === undefined) return { NULL: true };
        if (typeof value === "string") return { S: value };
        if (typeof value === "number") return { N: value.toString() };
        if (typeof value === "boolean") return { BOOL: value };
        if (Array.isArray(value)) return { L: value.map((v) => this.toAttr(v)) };
        if (typeof value === "object") {
            return { M: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, this.toAttr(v)])) };
        }
        throw new Error(`Unsupported type: ${typeof value}`);
    }

    private toDynamoRecord(recipe: Recipe): Record<string, AttributeValue> {
        return {
            recipeId: { S: recipe.recipeId },
            userId: { S: recipe.userId },
            title: { S: recipe.title },
            date: { S: recipe.date },
            description: { S: recipe.description },
            ingredients: { L: recipe.ingredients.map((i) => ({ M: { name: { S: i.name }, amount: { S: i.amount } } })) },
            directions: { L: recipe.directions.map((d) => ({ S: d })) },
            tags: { L: recipe.tags.map((t) => ({ S: t })) },
            servings: { S: recipe.servings },
            prepTime: { S: recipe.prepTime },
            cookTime: { S: recipe.cookTime },
            createdAt: { S: recipe.createdAt },
            ...(recipe.imageKey ? { imageKey: { S: recipe.imageKey } } : {}),
        };
    }

    private fromDynamoRecord(item: Record<string, AttributeValue>): Recipe {
        return {
            recipeId: item.recipeId?.S ?? '',
            userId: item.userId?.S ?? '',
            title: item.title?.S ?? '',
            date: item.date?.S ?? '',
            description: item.description?.S ?? '',
            ingredients: (item.ingredients?.L ?? []).map((i) => ({
                name: i.M?.name?.S ?? '',
                amount: i.M?.amount?.S ?? '',
            } as Ingredient)),
            directions: (item.directions?.L ?? []).map((d) => d.S ?? ''),
            tags: (item.tags?.L ?? []).map((t) => t.S ?? ''),
            servings: item.servings?.S ?? '',
            prepTime: item.prepTime?.S ?? '',
            cookTime: item.cookTime?.S ?? '',
            createdAt: item.createdAt?.S ?? '',
            imageKey: item.imageKey?.S,
        };
    }

    async addNewRecipe(recipe: Recipe): Promise<void> {
        const command = new PutItemCommand({
            TableName: this.recipeTableName,
            Item: this.toDynamoRecord(recipe),
        });
        await this.client.send(command);
    }

    async updateRecipe(recipe: Recipe): Promise<void> {
        // PutItem replaces the item entirely — same as add for our use case
        await this.addNewRecipe(recipe);
    }

    async deleteRecipe(userId: string, recipeId: string): Promise<void> {
        const command = new DeleteItemCommand({
            TableName: this.recipeTableName,
            Key: {
                userId: { S: userId },
                recipeId: { S: recipeId },
            },
        });
        await this.client.send(command);
    }

    async getAllRecipes(): Promise<Recipe[]> {
        const command = new ScanCommand({ TableName: this.recipeTableName });
        const response = await this.client.send(command);
        return (response.Items || []).map((item) => this.fromDynamoRecord(item));
    }
}
