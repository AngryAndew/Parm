import { Code, Function, FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export type ApiLambdaProps = {
    apiPath: string,
    authEnabled: boolean
};

export class ApiLambda extends Construct {
    public readonly lambdaFunction: Function
    constructor(scope: Construct, id: string, props: ApiLambdaProps) {
        super(scope, id);
        this.lambdaFunction = this.createlambdaFunction(props.apiPath, props.authEnabled);
    }
    private createlambdaFunction(apiPath: string, authEnabled: boolean): Function {
        const func = new Function(this, 'Function', {
            runtime: Runtime.NODEJS_LATEST,
            handler: `dist/index.${apiPath}`,
            code: Code.fromAsset('../api/build/lambda.zip'),
        });
        func.addFunctionUrl({
            authType: authEnabled ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE
        })

        return func;
    }
}


