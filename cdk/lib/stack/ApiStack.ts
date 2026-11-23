import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiLambda } from '../construct/Lambda';
import { DynamoTable } from '../construct/Dynamo';

export type ApiStackProps = {
    recipeTable: DynamoTable
} & StackProps;

export class ApiStack extends Stack {
    public readonly putRecipe: ApiLambda;
    public readonly importRecipe: ApiLambda;
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);
        this.putRecipe = this.createPutRecipeLambda();
        this.configurePutRecipePermissions(props.recipeTable);
        this.importRecipe = this.createImportRecipeLambda();

        // Printed after `cdk deploy` — paste these into the React app's .env file.
        new CfnOutput(this, 'PutRecipeUrl', { value: this.putRecipe.functionUrl.url });
        new CfnOutput(this, 'ImportRecipeUrl', { value: this.importRecipe.functionUrl.url });
    }

    private configurePutRecipePermissions(recipeTable: DynamoTable) {
        recipeTable.table.grantWriteData(this.putRecipe.lambdaFunction.role!!);
    }

    private createPutRecipeLambda(): ApiLambda {
        return new ApiLambda(this, 'putRecipe', {
            apiPath: 'putRecipe',
            authEnabled: false
        });
    }

    // Fetches a recipe web page and returns title/ingredients/directions/image.
    // Needs no table access; longer timeout because it waits on outside websites.
    private createImportRecipeLambda(): ApiLambda {
        return new ApiLambda(this, 'importRecipe', {
            apiPath: 'importRecipe',
            authEnabled: false,
            timeoutSeconds: 20,
            memorySize: 256
        });
    }
}
