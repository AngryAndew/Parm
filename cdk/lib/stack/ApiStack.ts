import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiLambda } from '../construct/Lambda';
import { DynamoTable } from '../construct/Dynamo';

export type ApiStackProps = {
    recipeTable: DynamoTable
} & StackProps;

export class ApiStack extends Stack {
    public readonly putRecipe: ApiLambda;
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        this.putRecipe = this.createPutRecipeLambda();
        this.configurePutRecipePermissions(props.recipeTable);
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
}