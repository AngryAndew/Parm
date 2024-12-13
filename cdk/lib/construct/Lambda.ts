import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export type ApiLambdaProps = {
    apiPath: string,
};

export class ApiLambda extends Construct {
    public readonly lambdaFunction: Function
    constructor(scope: Construct, id: string, props: ApiLambdaProps) {
        super(scope, id);

        this.lambdaFunction = this.createlambdaFunction(props.apiPath);
    }
    private createlambdaFunction(apiPath: string): Function {
        return new Function(this, 'Function', {
            runtime: Runtime.NODEJS_LATEST,
            handler: `dist/index.${apiPath}`,
            code: Code.fromAsset('../api/build/lambda.zip'),
        })
    }
}


