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
