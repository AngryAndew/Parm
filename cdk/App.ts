#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { NetworkingStack } from './lib/stack/NetworkingStack';
import { StorageStack } from './lib/stack/StorageStack';
import { ApiStack } from './lib/stack/ApiStack';
import { AuthStack } from './lib/stack/AuthStack';
import { CiStack } from './lib/stack/CiStack';

require('dotenv').config();

const disambiguator = process.env.DEPLOYMENT_DISAMBIGUATOR ?? throwIfMissing("DEPLOYMENT_DISAMBIGUATOR must be defined in the .env file");
const account = process.env.DEPLOYMENT_ACCOUNT ?? throwIfMissing("DEPLOYMENT_ACCOUNT must be defined in the .env file");
const region = process.env.DEPLOYMENT_REGION ?? throwIfMissing("DEPLOYMENT_REGION must be defined in the .env file");
const domainName = process.env.DOMAIN_NAME ?? throwIfMissing("DOMAIN_NAME must be defined in the .env file");

const app = new App();

const deploymentEnv = {
  account: account,
  region: region
};

const storageStack = new StorageStack(app, 'StorageStack', {
  hostingBucketName: domainName,
  env: deploymentEnv
});

const networkingStack = new NetworkingStack(app, 'NetworkingStack', {
  domainName: domainName,
  hostingBucket: storageStack.hostingBucket,
  env: deploymentEnv
});

const authStack = new AuthStack(app, 'AuthStack', {
  domainName: domainName,
  authDomainPrefix: `parm-${disambiguator}`.toLowerCase(),
  env: deploymentEnv
});

const apiStack = new ApiStack(app, 'ApiStack', {
  recipeTable: storageStack.recipeTable,
  imagesBucket: storageStack.imagesBucket,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  env: deploymentEnv
});

networkingStack.addDependency(storageStack);

// GitHub Actions deploy role. Optional .env settings:
//   GITHUB_REPO (default AngryAndew/Parm), DEPLOY_BRANCH (default mainline),
//   GITHUB_OIDC_PROVIDER_ARN (if your account already has the GitHub OIDC provider)
new CiStack(app, 'CiStack', {
  githubRepo: process.env.GITHUB_REPO ?? 'AngryAndew/Parm',
  deployBranch: process.env.DEPLOY_BRANCH ?? 'mainline',
  existingOidcProviderArn: process.env.GITHUB_OIDC_PROVIDER_ARN || undefined,
  env: deploymentEnv
});

function throwIfMissing(message: string): never {
  throw new Error(message);
}
