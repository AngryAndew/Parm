import { Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { ApiLambda } from '../construct/Lambda';
import { DynamoTable } from '../construct/Dynamo';

export type ApiStackProps = {
    recipeTable: DynamoTable;
    imagesBucket: Bucket;
} & StackProps;

export class ApiStack extends Stack {
    public readonly putRecipe: ApiLambda;
    public readonly getRecipes: ApiLambda;
    public readonly deleteRecipe: ApiLambda;
    public readonly updateRecipe: ApiLambda;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const tableEnv = { RECIPE_TABLE_NAME: props.recipeTable.table.tableName };
        const imageEnv = { IMAGES_BUCKET_NAME: props.imagesBucket.bucketName };

        this.putRecipe = new ApiLambda(this, 'putRecipe', { apiPath: 'putRecipe', authEnabled: false, environment: tableEnv });
        this.getRecipes = new ApiLambda(this, 'getRecipes', { apiPath: 'getRecipes', authEnabled: false, environment: tableEnv });
        this.deleteRecipe = new ApiLambda(this, 'deleteRecipe', { apiPath: 'deleteRecipe', authEnabled: false, environment: tableEnv });
        this.updateRecipe = new ApiLambda(this, 'updateRecipe', { apiPath: 'updateRecipe', authEnabled: false, environment: tableEnv });

        props.recipeTable.table.grantWriteData(this.putRecipe.lambdaFunction.role!!);
        props.recipeTable.table.grantReadData(this.getRecipes.lambdaFunction.role!!);
        props.recipeTable.table.grantWriteData(this.deleteRecipe.lambdaFunction.role!!);
        props.recipeTable.table.grantWriteData(this.updateRecipe.lambdaFunction.role!!);

        props.imagesBucket.grantReadWrite(this.putRecipe.lambdaFunction.role!!);
        props.imagesBucket.grantReadWrite(this.updateRecipe.lambdaFunction.role!!);
        props.imagesBucket.grantPublicAccess();
    }
}
