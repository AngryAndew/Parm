import { CfnOutput } from "aws-cdk-lib";
import { Code, Function, FunctionUrl, FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export type ApiLambdaProps = {
    apiPath: string,
    authEnabled: boolean,
    environment?: Record<string, string>
};

export class ApiLambda extends Construct {
    public readonly lambdaFunction: Function;
    public readonly functionUrl: FunctionUrl;

    constructor(scope: Construct, id: string, props: ApiLambdaProps) {
        super(scope, id);
        this.lambdaFunction = this.createlambdaFunction(props.apiPath, props.authEnabled, props.environment);
        this.functionUrl = this.lambdaFunction.addFunctionUrl({
            authType: props.authEnabled ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE
        });

        new CfnOutput(scope, `${id}Url`, {
            value: this.functionUrl.url,
            description: `Function URL for ${props.apiPath}`
        });
    }

    private createlambdaFunction(apiPath: string, authEnabled: boolean, environment?: Record<string, string>): Function {
        return new Function(this, 'Function', {
            runtime: Runtime.NODEJS_LATEST,
            handler: `dist/index.${apiPath}`,
            code: Code.fromAsset('../api/build/lambda.zip'),
            environment: environment ?? {}
        });
    }
}


