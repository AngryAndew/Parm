#!/usr/bin/env bash
# Builds the React app and uploads it to the private site bucket behind CloudFront.
# Needs AWS credentials, a filled-in .env at the repo root, and NetworkingStack deployed.
set -euo pipefail
cd "$(dirname "$0")"

output() {
  aws cloudformation describe-stacks --stack-name NetworkingStack \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
BUCKET=$(output SiteBucketName)
DISTRIBUTION_ID=$(output DistributionId)

npm ci
npm run build
aws s3 sync build/ "s3://$BUCKET" --delete
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" > /dev/null
echo "Deployed to $(output SiteUrl)"
