import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket, BucketEncryption, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { DynamoTable } from '../construct/Dynamo';

export type StorageStackProps = {
  hostingBucketName: string
} & StackProps;

export class StorageStack extends Stack {
  public readonly hostingBucket: Bucket;
  public readonly recipeTable: DynamoTable;
  public readonly imagesBucket: Bucket;
  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    this.hostingBucket = this.createHostingBucket(props.hostingBucketName);
    this.configureHostingBucketPermissions(this.hostingBucket);
    this.recipeTable = this.createDynamoTable();
    this.imagesBucket = this.createImagesBucket();
  }

  // Private bucket for recipe photos. The browser uploads/downloads with signed URLs.
  // RETAIN so photos survive even if the stack is deleted.
  private createImagesBucket(): Bucket {
    return new Bucket(this, 'imagesBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [{
        allowedOrigins: ['*'],
        allowedMethods: [HttpMethods.PUT, HttpMethods.GET],
        allowedHeaders: ['*'],
        maxAge: 3000,
      }],
    });
  }

  private createHostingBucket(bucketName: string): Bucket {
    return new Bucket(this, 'hostingBucket', {
      bucketName: bucketName,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      // Private: only CloudFront can read the site files (see NetworkingStack).
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });
  }

  private createDynamoTable(): DynamoTable {
    return new DynamoTable(this, 'recipeTable', {
      partitionKey: 'userId',
      sortKey: 'recipeId'
    });
  }

  // Lets CloudFront distributions in this account read the site files through
  // Origin Access Control. (The distribution lives in NetworkingStack; granting by
  // account here avoids a circular dependency between the two stacks.)
  private configureHostingBucketPermissions(bucket: Bucket) {
    bucket.addToResourcePolicy(new PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [bucket.arnForObjects('*')],
      principals: [new ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        StringLike: { 'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/*` },
      },
    }));
  }
}