import { Handler } from "aws-lambda";
import { DynamoDbProxy } from '../proxy/DynamoDbProxy'
import { Recipe } from "../model/Recipe";

export const putRecipe: Handler = async (event, context) => {
    const dynamoProxy = new DynamoDbProxy('us-east-1');
    try {
        const recipe = JSON.parse(event.body)
        await dynamoProxy.addNewRecipe(recipe)
        return {
            statusCode: 200,
            body: "Craig sucks"
        }
    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal Server Error"
            })
        }
    }

}