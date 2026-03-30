import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption, CorsRule, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { DynamoTable } from '../construct/Dynamo';

export type StorageStackProps = {
  hostingBucketName: string;
} & StackProps;

export class StorageStack extends Stack {
  public readonly hostingBucket: Bucket;
  public readonly imagesBucket: Bucket;
  public readonly recipeTable: DynamoTable;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);
    this.hostingBucket = this.createHostingBucket(props.hostingBucketName);
    this.configureHostingBucketPermissions(this.hostingBucket);
    this.imagesBucket = this.createImagesBucket();
    this.recipeTable = this.createDynamoTable();
  }

  private createHostingBucket(bucketName: string): Bucket {
    return new Bucket(this, 'hostingBucket', {
      bucketName: bucketName,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: new BlockPublicAccess({ restrictPublicBuckets: false, blockPublicPolicy: false }),
    });
  }

  private createImagesBucket(): Bucket {
    const corRule: CorsRule = {
      allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
    };
    return new Bucket(this, 'imagesBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: new BlockPublicAccess({ restrictPublicBuckets: false, blockPublicPolicy: false }),
      cors: [corRule],
    });
  }

  private createDynamoTable(): DynamoTable {
    return new DynamoTable(this, 'recipeTable', {
      partitionKey: 'userId',
      sortKey: 'recipeId',
    });
  }

  private configureHostingBucketPermissions(bucket: Bucket) {
    bucket.grantPublicAccess();
  }
}
