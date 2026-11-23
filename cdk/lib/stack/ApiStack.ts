import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiLambda } from '../construct/Lambda';
import { DynamoTable } from '../construct/Dynamo';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';

export type ApiStackProps = {
    recipeTable: DynamoTable,
    imagesBucket: Bucket,
    userPool: UserPool,
    userPoolClient: UserPoolClient
} & StackProps;

export class ApiStack extends Stack {
    public readonly putRecipe: ApiLambda;
    public readonly importRecipe: ApiLambda;
    public readonly getUploadUrl: ApiLambda;
    public readonly getRecipes: ApiLambda;
    // Every Lambda checks the caller's Cognito token, so each one needs these.
    private readonly authEnvironment: Record<string, string>;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);
        this.authEnvironment = {
            COGNITO_USER_POOL_ID: props.userPool.userPoolId,
            COGNITO_CLIENT_ID: props.userPoolClient.userPoolClientId
        };
        this.putRecipe = this.createPutRecipeLambda(props.recipeTable);
        this.configurePutRecipePermissions(props.recipeTable);
        this.importRecipe = this.createImportRecipeLambda();
        this.getUploadUrl = this.createGetUploadUrlLambda(props.imagesBucket);
        this.getRecipes = this.createGetRecipesLambda(props.recipeTable, props.imagesBucket);

        // Printed after `cdk deploy` — paste these into the React app's .env file.
        new CfnOutput(this, 'PutRecipeUrl', { value: this.putRecipe.functionUrl.url });
        new CfnOutput(this, 'ImportRecipeUrl', { value: this.importRecipe.functionUrl.url });
        new CfnOutput(this, 'GetUploadUrl', { value: this.getUploadUrl.functionUrl.url });
        new CfnOutput(this, 'GetRecipesUrl', { value: this.getRecipes.functionUrl.url });
    }

    private configurePutRecipePermissions(recipeTable: DynamoTable) {
        recipeTable.table.grantWriteData(this.putRecipe.lambdaFunction.role!!);
    }

    private createPutRecipeLambda(recipeTable: DynamoTable): ApiLambda {
        return new ApiLambda(this, 'putRecipe', {
            apiPath: 'putRecipe',
            authEnabled: false, // IAM auth off; the Lambda verifies the Cognito token itself
            environment: {
                ...this.authEnvironment,
                RECIPE_TABLE_NAME: recipeTable.table.tableName
            }
        });
    }

    // Fetches a recipe web page and returns title/ingredients/directions/image.
    // Needs no table access; longer timeout because it waits on outside websites.
    private createImportRecipeLambda(): ApiLambda {
        return new ApiLambda(this, 'importRecipe', {
            apiPath: 'importRecipe',
            authEnabled: false, // IAM auth off; the Lambda verifies the Cognito token itself
            timeoutSeconds: 20,
            memorySize: 256,
            environment: this.authEnvironment
        });
    }

    // Hands the browser a short-lived signed URL to upload a recipe photo to S3.
    private createGetUploadUrlLambda(imagesBucket: Bucket): ApiLambda {
        const lambda = new ApiLambda(this, 'getUploadUrl', {
            apiPath: 'getUploadUrl',
            authEnabled: false, // IAM auth off; the Lambda verifies the Cognito token itself
            environment: {
                ...this.authEnvironment,
                IMAGES_BUCKET_NAME: imagesBucket.bucketName
            }
        });
        imagesBucket.grantPut(lambda.lambdaFunction);
        return lambda;
    }

    // Lists saved recipes (DynamoDB Query) with signed photo URLs.
    private createGetRecipesLambda(recipeTable: DynamoTable, imagesBucket: Bucket): ApiLambda {
        const lambda = new ApiLambda(this, 'getRecipes', {
            apiPath: 'getRecipes',
            authEnabled: false, // IAM auth off; the Lambda verifies the Cognito token itself
            timeoutSeconds: 10,
            environment: {
                ...this.authEnvironment,
                RECIPE_TABLE_NAME: recipeTable.table.tableName,
                IMAGES_BUCKET_NAME: imagesBucket.bucketName
            }
        });
        recipeTable.table.grantReadData(lambda.lambdaFunction);
        imagesBucket.grantRead(lambda.lambdaFunction);
        return lambda;
    }
}
