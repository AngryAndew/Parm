# Parm - CDK Infrastructure

## Prerequisites

- Node.js (v18+)
- AWS CLI installed and configured (`aws configure`)
- AWS CDK CLI (`npm install -g aws-cdk`)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in this directory:
```
DEPLOYMENT_DISAMBIGUATOR=prod
DEPLOYMENT_ACCOUNT=<your 12-digit AWS account ID>
DEPLOYMENT_REGION=us-east-1
DOMAIN_NAME=<your domain, e.g. recipes.yourdomain.com>
```

3. Bootstrap CDK (first time only):
```bash
npx cdk bootstrap
```

## Deploy

Build the API Lambda first, then deploy all stacks:

```bash
# From project root
cd api && npm install && npm run build
cd ../cdk && npx cdk deploy --all
```

After deploy, CDK will print the Lambda function URLs as outputs. Copy them into a `.env` file at the **project root**:

```
REACT_APP_LAMBDA_URL=<putRecipe url>
REACT_APP_GET_RECIPES_LAMBDA_URL=<getRecipes url>
REACT_APP_DELETE_RECIPE_LAMBDA_URL=<deleteRecipe url>
REACT_APP_UPDATE_RECIPE_LAMBDA_URL=<updateRecipe url>
```

Then build and deploy the frontend:

```bash
# From project root
npm install
npm run build
npm run deploy
```

## Stacks

- `StorageStack` — DynamoDB recipe table + S3 hosting bucket + S3 images bucket
- `NetworkingStack` — Route53 A record pointing your domain at the hosting bucket
- `ApiStack` — Four Lambda functions with function URLs:
  - `putRecipe` — create a recipe
  - `getRecipes` — fetch all recipes
  - `updateRecipe` — edit an existing recipe
  - `deleteRecipe` — delete a recipe
