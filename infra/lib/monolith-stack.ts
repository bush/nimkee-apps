import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';
import * as path from 'path';

export class MonolithStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Public subnets only — no NAT Gateway needed, security groups handle isolation
    const vpc = new ec2.Vpc(this, 'MonolithVpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const cluster = new ecs.Cluster(this, 'MonolithCluster', {
      vpc,
    });

    // ALB accepts traffic from the internet
    const albSecurityGroup = new ec2.SecurityGroup(this, 'PublicIngressSG', {
      vpc,
      description: 'Allows inbound HTTP and HTTPS from the internet',
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS');

    // Fargate only accepts traffic from the ALB
    const fargateSecurityGroup = new ec2.SecurityGroup(this, 'AppIngressSG', {
      vpc,
      description: 'Allows inbound traffic from ALB only',
    });
    fargateSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(3000), 'Allow from ALB');

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'MonolithService', {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 2,  // one per AZ for high availability
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../../apis')),
        containerPort: 3000,
        environment: {
          PORT: '3000',
          NODE_ENV: 'production',
        },
      },
      publicLoadBalancer: true,
      assignPublicIp: true,  // required when no NAT Gateway — allows ECR image pulls
      securityGroups: [fargateSecurityGroup],
      loadBalancerName: 'monolith-alb',
    });

    service.loadBalancer.addSecurityGroup(albSecurityGroup);
  }
}
