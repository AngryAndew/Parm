import {Handler} from "aws-lambda";

export const putRecipe: Handler = async(event, context) => {
    return {
        statusCode: 200,
        body: "Hello World"
    }
}