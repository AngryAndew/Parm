import { aws_route53_targets, Stack, StackProps } from 'aws-cdk-lib';
import { ARecord, IHostedZone, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { BucketWebsiteTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export type NetworkingStackProps = {
  domainName: string,
  hostingBucket: Bucket
} & StackProps;

export class NetworkingStack extends Stack {
  public readonly publicHostedZone: IHostedZone;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);
    
    this.publicHostedZone = this.getHostedZoneForDomain(props.domainName);
    this.configureHostedZoneRecords(this.publicHostedZone, props.hostingBucket);
  }

  private getHostedZoneForDomain(domainName: string): IHostedZone {
    return PublicHostedZone.fromLookup(this, 'hostedZone', {
      domainName: domainName
    });
  }

  private configureHostedZoneRecords(
    hostedZone: IHostedZone,
    hostingBucket: Bucket
  ) {
    const staticAssetsARecord = new ARecord(this, 'staticAssetsARecord', {
      zone: hostedZone,
      target: RecordTarget.fromAlias(new BucketWebsiteTarget(hostingBucket))
    });
  }
}