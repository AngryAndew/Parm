import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Recipe } from "../model/Recipe";

export class DynamoDbProxy {
    private client: DynamoDBDocumentClient;
    private recipeTableName: string;

    constructor(region: string = process.env.AWS_REGION ?? "us-east-1") {
        // The document client converts plain JS objects/arrays to DynamoDB types for us.
        this.client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
            marshallOptions: { removeUndefinedValues: true },
        });
        const tableName = process.env.RECIPE_TABLE_NAME;
        if (!tableName) throw new Error("RECIPE_TABLE_NAME environment variable is not set");
        this.recipeTableName = tableName;
    }

    // Creates the recipe, or replaces it if the same userId + recipeId already exists.
    async putRecipe(recipe: Recipe): Promise<void> {
        await this.client.send(new PutCommand({
            TableName: this.recipeTableName,
            Item: recipe,
        }));
    }

    // All recipes for one user/household. Query reads only that partition (cheaper than Scan).
    async listRecipes(userId: string): Promise<Recipe[]> {
        const recipes: Recipe[] = [];
        let startKey: Record<string, any> | undefined;
        do {
            const page = await this.client.send(new QueryCommand({
                TableName: this.recipeTableName,
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: { ":userId": userId },
                ExclusiveStartKey: startKey,
            }));
            recipes.push(...((page.Items ?? []) as Recipe[]));
            startKey = page.LastEvaluatedKey;
        } while (startKey);
        return recipes;
    }
}
