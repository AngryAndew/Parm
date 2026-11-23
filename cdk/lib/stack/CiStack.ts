import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { IOpenIdConnectProvider, OpenIdConnectProvider, PolicyStatement, Role, WebIdentityPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export type CiStackProps = {
  githubRepo: string,                 // e.g. "AngryAndew/Parm"
  deployBranch: string,               // e.g. "mainline"
  existingOidcProviderArn?: string,   // set if the account already has the GitHub OIDC provider
} & StackProps;

// Lets GitHub Actions deploy without stored AWS keys: the workflow trades its
// GitHub OIDC token for this role, which only pushes from the deploy branch can assume.
export class CiStack extends Stack {
  constructor(scope: Construct, id: string, props: CiStackProps) {
    super(scope, id, props);

    const provider: IOpenIdConnectProvider = props.existingOidcProviderArn
      ? OpenIdConnectProvider.fromOpenIdConnectProviderArn(this, 'githubOidc', props.existingOidcProviderArn)
      : new OpenIdConnectProvider(this, 'githubOidc', {
          url: 'https://token.actions.githubusercontent.com',
          clientIds: ['sts.amazonaws.com'],
        });

    const role = new Role(this, 'githubDeployRole', {
      roleName: 'parm-github-deploy',
      maxSessionDuration: Duration.hours(1),
      assumedBy: new WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': `repo:${props.githubRepo}:ref:refs/heads/${props.deployBranch}`,
        },
      }),
    });

    // `cdk deploy` works by assuming the roles `cdk bootstrap` created.
    role.addToPolicy(new PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
    }));
    // Read stack outputs, upload the site, clear the CloudFront cache.
    role.addToPolicy(new PolicyStatement({
      actions: ['cloudformation:DescribeStacks'],
      resources: ['*'],
    }));
    role.addToPolicy(new PolicyStatement({
      actions: ['s3:ListBucket', 's3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: ['arn:aws:s3:::*'],
      conditions: { StringEquals: { 's3:ResourceAccount': this.account } },
    }));
    role.addToPolicy(new PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [`arn:aws:cloudfront::${this.account}:distribution/*`],
    }));

    new CfnOutput(this, 'GithubDeployRoleArn', { value: role.roleArn });
  }
}
