import { Handler } from "aws-lambda";
import { DynamoDbProxy } from '../proxy/DynamoDbProxy';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
};

export const getRecipes: Handler = async (event, context) => {
    const dynamoProxy = new DynamoDbProxy('us-east-1');
    try {
        const recipes = await dynamoProxy.getAllRecipes();
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(recipes) };
    } catch (error: any) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Internal Server Error" }) };
    }
};
