#!/usr/bin/env bash
# Writes the React app's .env from the deployed stacks' outputs.
set -euo pipefail
cd "$(dirname "$0")"

output() {
  aws cloudformation describe-stacks --stack-name "$1" \
    --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue" --output text
}

cat > .env <<ENV
REACT_APP_PUT_RECIPE_URL=$(output ApiStack PutRecipeUrl)
REACT_APP_IMPORT_RECIPE_URL=$(output ApiStack ImportRecipeUrl)
REACT_APP_GET_UPLOAD_URL=$(output ApiStack GetUploadUrl)
REACT_APP_GET_RECIPES_URL=$(output ApiStack GetRecipesUrl)
REACT_APP_COGNITO_AUTHORITY=$(output AuthStack CognitoAuthority)
REACT_APP_COGNITO_CLIENT_ID=$(output AuthStack UserPoolClientId)
REACT_APP_COGNITO_DOMAIN=$(output AuthStack CognitoDomain)
ENV
echo "Wrote .env"
