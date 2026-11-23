# Deploying the Website

To deploy this to your own account do the following:

1. Create a `.env` file with the following format:
DEPLOYMENT_DISAMBIGUATOR=<SOME DISAMBIGUATOR>
DEPLOYMENT_ACCOUNT=<AWS ACCOUNT ID>
DEPLOYMENT_REGION=<AWS DEPLOYMENT REGION>
DOMAIN_NAME=<DOMAIN NAME TO CREATE THE WEBSITE FOR>

2. Get AWS Credentials for an IAM User/Role that has permissions to deploy Cloudformation resources
3. Deploy the `NetworkingStack` by running `cdk deploy NetworkingStack`
## Login (Cognito)

`AuthStack` creates a Cognito user pool with self sign-up turned off, so only
accounts you create can sign in. Deploy it before `ApiStack`:

```
cdk deploy AuthStack ApiStack
```

Create an account for each person (Cognito emails them a temporary password,
and they choose their own the first time they sign in):

```
aws cognito-idp admin-create-user \
  --user-pool-id <UserPoolId output> \
  --username someone@example.com \
  --user-attributes Name=email,Value=someone@example.com Name=email_verified,Value=true
```

Copy the `CognitoAuthority`, `UserPoolClientId` and `CognitoDomain` outputs into
the root `.env` as `REACT_APP_COGNITO_AUTHORITY`, `REACT_APP_COGNITO_CLIENT_ID`
and `REACT_APP_COGNITO_DOMAIN`. Login redirects are allowed back to
`https://<DOMAIN_NAME>/` and `http://localhost:3000/`.

## HTTPS and the website

`NetworkingStack` must be deployed to `us-east-1` (CloudFront only accepts ACM
certificates from that region). It creates the certificate (validated through
your Route 53 zone), a CloudFront distribution in front of the now-private site
bucket, and A/AAAA records for the domain.

To publish the React app, run `./deploy_site.sh` from the repo root. It builds
the app, syncs `build/` to the site bucket and clears the CloudFront cache.

## Automatic deploys (GitHub Actions)

`.github/workflows/deploy.yml` deploys every push to `mainline`: it builds the
Lambdas, runs `cdk deploy --all`, then builds and uploads the website. It signs
in to AWS with GitHub's OIDC token, so no AWS keys are stored in GitHub.

One-time setup:

1. Deploy `CiStack` once from your machine: `cdk deploy CiStack`. If your account
   already has the `token.actions.githubusercontent.com` OIDC provider, first set
   `GITHUB_OIDC_PROVIDER_ARN=<its ARN>` in `cdk/.env`.
2. In GitHub → Settings → Secrets and variables → Actions:
   - Secret `AWS_DEPLOY_ROLE_ARN` = the `GithubDeployRoleArn` output.
   - Variables `DEPLOYMENT_DISAMBIGUATOR`, `DEPLOYMENT_ACCOUNT`,
     `DEPLOYMENT_REGION`, `DOMAIN_NAME` (same values as `cdk/.env`), plus
     `GITHUB_OIDC_PROVIDER_ARN` if you set it above.

You can also run the workflow by hand from the Actions tab.
