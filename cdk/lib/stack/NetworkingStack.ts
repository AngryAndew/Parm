import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { AaaaRecord, ARecord, IHostedZone, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export type NetworkingStackProps = {
  domainName: string,
  hostingBucket: Bucket
} & StackProps;

// Serves the site over HTTPS: Route 53 -> CloudFront (ACM certificate) -> private S3 bucket.
export class NetworkingStack extends Stack {
  public readonly publicHostedZone: IHostedZone;
  public readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    // CloudFront only accepts certificates from us-east-1.
    if (this.region !== 'us-east-1') {
      throw new Error(`NetworkingStack must deploy to us-east-1 for the CloudFront certificate (got ${this.region}).`);
    }

    this.publicHostedZone = this.getHostedZoneForDomain(props.domainName);
    const certificate = new Certificate(this, 'siteCertificate', {
      domainName: props.domainName,
      validation: CertificateValidation.fromDns(this.publicHostedZone),
    });
    this.distribution = this.createDistribution(props.domainName, props.hostingBucket, certificate);
    this.configureHostedZoneRecords(this.publicHostedZone, this.distribution);

    new CfnOutput(this, 'SiteUrl', { value: `https://${props.domainName}` });
    new CfnOutput(this, 'DistributionId', { value: this.distribution.distributionId });
    new CfnOutput(this, 'SiteBucketName', { value: props.hostingBucket.bucketName });
  }

  private getHostedZoneForDomain(domainName: string): IHostedZone {
    return PublicHostedZone.fromLookup(this, 'hostedZone', {
      domainName: domainName
    });
  }

  private createDistribution(domainName: string, hostingBucket: Bucket, certificate: Certificate): Distribution {
    // Imported by name so this stack doesn't edit the bucket's policy (StorageStack grants
    // CloudFront access), which would otherwise create a circular stack dependency.
    const siteBucket = Bucket.fromBucketName(this, 'siteBucket', hostingBucket.bucketName);
    return new Distribution(this, 'siteDistribution', {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [domainName],
      certificate: certificate,
      defaultRootObject: 'index.html',
      // Single-page app: unknown paths (and the private bucket's 403s) serve index.html.
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
      priceClass: PriceClass.PRICE_CLASS_100,
    });
  }

  private configureHostedZoneRecords(hostedZone: IHostedZone, distribution: Distribution) {
    const target = RecordTarget.fromAlias(new CloudFrontTarget(distribution));
    // Same construct ID as before, so the existing A record is updated in place.
    new ARecord(this, 'staticAssetsARecord', { zone: hostedZone, target });
    new AaaaRecord(this, 'staticAssetsAaaaRecord', { zone: hostedZone, target });
  }
}
