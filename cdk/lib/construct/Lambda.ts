import { Duration } from "aws-cdk-lib";
import { Code, Function, FunctionUrl, FunctionUrlAuthType, HttpMethod, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export type ApiLambdaProps = {
    apiPath: string,
    authEnabled: boolean,
    timeoutSeconds?: number,
    memorySize?: number,
    environment?: Record<string, string>
};

export class ApiLambda extends Construct {
    public readonly lambdaFunction: Function
    public readonly functionUrl: FunctionUrl
    constructor(scope: Construct, id: string, props: ApiLambdaProps) {
        super(scope, id);
        this.lambdaFunction = this.createlambdaFunction(props);
        this.functionUrl = this.lambdaFunction.addFunctionUrl({
            authType: props.authEnabled ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE,
            // Lets the React site (a different origin) call this URL from the browser.
            cors: {
                allowedOrigins: ['*'],
                allowedMethods: [HttpMethod.POST, HttpMethod.GET],
                allowedHeaders: ['Content-Type'],
            },
        });
    }
    private createlambdaFunction(props: ApiLambdaProps): Function {
        return new Function(this, 'Function', {
            runtime: Runtime.NODEJS_LATEST,
            handler: `dist/index.${props.apiPath}`,
            code: Code.fromAsset('../api/build/lambda.zip'),
            timeout: Duration.seconds(props.timeoutSeconds ?? 3),
            memorySize: props.memorySize ?? 128,
            environment: props.environment,
        });
    }
}
