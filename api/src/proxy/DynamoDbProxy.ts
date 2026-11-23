import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
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
}
