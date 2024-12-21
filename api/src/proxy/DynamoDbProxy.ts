import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand, ScanCommand, AttributeValue } from "@aws-sdk/client-dynamodb";
import { Recipe } from "../model/Recipe";

export class DynamoDbProxy {
    private client: DynamoDBClient;
    private recipeTableName: string;
    constructor(region: string) {
        this.client = new DynamoDBClient({ region });
        this.recipeTableName = "StorageStack-recipeTable1D8FA348-NRYDU7A77R3U";
    }
    private convert(value: any): any {
        if (value === null) {
            return { NULL: true };
        } else if (typeof value === "string") {
            return { S: value };
        } else if (typeof value === "number") {
            return { N: value.toString() };
        } else if (typeof value === "boolean") {
            return { BOOL: value };
        } else if (Array.isArray(value)) {
            return { L: value.map(this.convert) };
        } else if (typeof value === "object") {
            return { M: this.toDynamoRecord(value) };
        } else {
            throw new Error(`Unsupported value type: ${typeof value}`);
        }
    }

    private toDynamoRecord(recipe: Recipe): Record<string, AttributeValue> {
        return {
            recipeId: this.convert(recipe.recipeId),
            userId: this.convert(recipe.userId),
            description: this.convert(recipe.description),
        };
    }

    // Get item from table
    // async getItem(tableName: string, key: Record<string, any>): Promise<any> {
    //     const command = new GetItemCommand({
    //         TableName: tableName,
    //         Key: key,
    //     });

    //     const response = await this.client.send(command);
    //     return response.Item || null;
    // }

    // add recipe into table
    async addNewRecipe(recipe: Recipe): Promise<void> {
        const command = new PutItemCommand({
            TableName: this.recipeTableName,
            Item: this.toDynamoRecord(recipe),
        });

        await this.client.send(command);
    }

    // Delete item from table
    // async deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
    //     const command = new DeleteItemCommand({
    //         TableName: tableName,
    //         Key: key,
    //     });

    //     await this.client.send(command);
    // }

    // // Scan table
    // async scanTable(tableName: string): Promise<any[]> {
    //     const command = new ScanCommand({ TableName: tableName });

    //     const response = await this.client.send(command);
    //     return response.Items || [];
    // }
}

