# Deploying the Website

To deploy this to your own account do the following:

1. Create a `.env` file with the following format:
DEPLOYMENT_DISAMBIGUATOR=<SOME DISAMBIGUATOR>
DEPLOYMENT_ACCOUNT=<AWS ACCOUNT ID>
DEPLOYMENT_REGION=<AWS DEPLOYMENT REGION>
DOMAIN_NAME=<DOMAIN NAME TO CREATE THE WEBSITE FOR>

2. Get AWS Credentials for an IAM User/Role that has permissions to deploy Cloudformation resources
3. Deploy the `NetworkingStack` by running `cdk deploy NetworkingStack`