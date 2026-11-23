import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AccountRecovery, OAuthScope, UserPool, UserPoolClient, UserPoolDomain } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export type AuthStackProps = {
  domainName: string,         // the website's domain, used for login redirects
  authDomainPrefix: string,   // becomes https://<prefix>.auth.<region>.amazoncognito.com
} & StackProps;

// Cognito login for the site. Self sign-up is OFF: accounts are created by an
// admin (see cdk/README.md), so only the people you add can sign in.
export class AuthStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, 'userPool', {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      passwordPolicy: { minLength: 10, requireSymbols: false },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const redirectUrls = [`https://${props.domainName}/`, 'http://localhost:3000/'];
    this.userPoolClient = this.userPool.addClient('webClient', {
      generateSecret: false, // browser app: uses authorization code + PKCE
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
        callbackUrls: redirectUrls,
        logoutUrls: redirectUrls,
      },
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
      preventUserExistenceErrors: true,
    });

    const domain = new UserPoolDomain(this, 'loginDomain', {
      userPool: this.userPool,
      cognitoDomain: { domainPrefix: props.authDomainPrefix },
    });

    new CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
    new CfnOutput(this, 'CognitoAuthority', { value: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}` });
    new CfnOutput(this, 'CognitoDomain', { value: domain.baseUrl() });
  }
}
