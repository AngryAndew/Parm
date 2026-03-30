import { Handler } from "aws-lambda";
import { DynamoDbProxy } from '../proxy/DynamoDbProxy';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
};

export const deleteRecipe: Handler = async (event, context) => {
    const dynamoProxy = new DynamoDbProxy('us-east-1');
    try {
        const { userId, recipeId } = JSON.parse(event.body);
        if (!userId || !recipeId) {
            return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "userId and recipeId are required" }) };
        }
        await dynamoProxy.deleteRecipe(userId, recipeId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    } catch (error: any) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Internal Server Error" }) };
    }
};
