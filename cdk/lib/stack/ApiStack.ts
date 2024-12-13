import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiLambda } from '../construct/Lambda';

export type ApiStackProps = {
} & StackProps;

export class ApiStack extends Stack {
    public readonly putRecipe: ApiLambda;
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);
        this.putRecipe = this.createPutRecipeLambda();
    }

    private createPutRecipeLambda(): ApiLambda {
        return new ApiLambda(this, 'putRecipe', {
            apiPath: 'putRecipe',
        });
    }
}