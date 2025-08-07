#!/usr/bin/env python3
"""
AWS Workshop Setup Script
Automated setup for Question Bank System on AWS

Author: Linh Dang Dev
Date: 2025-08-03
"""

import boto3
import json
import time
import subprocess
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional

class AWSWorkshopSetup:
    def __init__(self, region: str = "ap-southeast-1"):
        self.region = region
        self.session = boto3.Session(region_name=region)
        self.account_id = self.session.client('sts').get_caller_identity()['Account']
        
        # Initialize AWS clients
        self.ec2 = self.session.client('ec2')
        self.rds = self.session.client('rds')
        self.ecs = self.session.client('ecs')
        self.ecr = self.session.client('ecr')
        self.elbv2 = self.session.client('elbv2')
        self.s3 = self.session.client('s3')
        self.cloudformation = self.session.client('cloudformation')
        self.secretsmanager = self.session.client('secretsmanager')
        
        print(f"🚀 AWS Workshop Setup initialized for account: {self.account_id}")
        print(f"📍 Region: {self.region}")

    def check_prerequisites(self) -> bool:
        """Check if all prerequisites are met"""
        print("\n🔍 Checking prerequisites...")
        
        try:
            # Check AWS CLI
            subprocess.run(['aws', '--version'], check=True, capture_output=True)
            print("✅ AWS CLI installed")
            
            # Check Docker
            subprocess.run(['docker', '--version'], check=True, capture_output=True)
            print("✅ Docker installed")
            
            # Check CDK
            subprocess.run(['cdk', '--version'], check=True, capture_output=True)
            print("✅ AWS CDK installed")
            
            # Check AWS credentials
            self.session.client('sts').get_caller_identity()
            print("✅ AWS credentials configured")
            
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Missing prerequisite: {e}")
            return False
        except Exception as e:
            print(f"❌ Error checking prerequisites: {e}")
            return False

    def create_vpc_and_subnets(self) -> Dict[str, str]:
        """Create VPC with public and private subnets"""
        print("\n🏗️ Creating VPC and subnets...")
        
        try:
            # Create VPC
            vpc_response = self.ec2.create_vpc(
                CidrBlock='10.0.0.0/16',
                TagSpecifications=[{
                    'ResourceType': 'vpc',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'QuestionBank-VPC'},
                        {'Key': 'Project', 'Value': 'QuestionBank'},
                        {'Key': 'Environment', 'Value': 'Workshop'}
                    ]
                }]
            )
            vpc_id = vpc_response['Vpc']['VpcId']
            print(f"✅ VPC created: {vpc_id}")
            
            # Enable DNS hostnames
            self.ec2.modify_vpc_attribute(VpcId=vpc_id, EnableDnsHostnames={'Value': True})
            self.ec2.modify_vpc_attribute(VpcId=vpc_id, EnableDnsSupport={'Value': True})
            
            # Get availability zones
            azs = self.ec2.describe_availability_zones()['AvailabilityZones'][:2]
            
            # Create Internet Gateway
            igw_response = self.ec2.create_internet_gateway(
                TagSpecifications=[{
                    'ResourceType': 'internet-gateway',
                    'Tags': [{'Key': 'Name', 'Value': 'QuestionBank-IGW'}]
                }]
            )
            igw_id = igw_response['InternetGateway']['InternetGatewayId']
            self.ec2.attach_internet_gateway(InternetGatewayId=igw_id, VpcId=vpc_id)
            print(f"✅ Internet Gateway created: {igw_id}")
            
            # Create subnets
            subnets = {}
            
            # Public subnets
            for i, az in enumerate(azs):
                subnet_response = self.ec2.create_subnet(
                    VpcId=vpc_id,
                    CidrBlock=f'10.0.{i+1}.0/24',
                    AvailabilityZone=az['ZoneName'],
                    TagSpecifications=[{
                        'ResourceType': 'subnet',
                        'Tags': [
                            {'Key': 'Name', 'Value': f'QuestionBank-Public-{i+1}'},
                            {'Key': 'Type', 'Value': 'Public'}
                        ]
                    }]
                )
                subnet_id = subnet_response['Subnet']['SubnetId']
                subnets[f'public_{i+1}'] = subnet_id
                
                # Enable auto-assign public IP
                self.ec2.modify_subnet_attribute(
                    SubnetId=subnet_id,
                    MapPublicIpOnLaunch={'Value': True}
                )
                print(f"✅ Public subnet {i+1} created: {subnet_id}")
            
            # Private subnets
            for i, az in enumerate(azs):
                subnet_response = self.ec2.create_subnet(
                    VpcId=vpc_id,
                    CidrBlock=f'10.0.{i+10}.0/24',
                    AvailabilityZone=az['ZoneName'],
                    TagSpecifications=[{
                        'ResourceType': 'subnet',
                        'Tags': [
                            {'Key': 'Name', 'Value': f'QuestionBank-Private-{i+1}'},
                            {'Key': 'Type', 'Value': 'Private'}
                        ]
                    }]
                )
                subnet_id = subnet_response['Subnet']['SubnetId']
                subnets[f'private_{i+1}'] = subnet_id
                print(f"✅ Private subnet {i+1} created: {subnet_id}")
            
            # Database subnets
            for i, az in enumerate(azs):
                subnet_response = self.ec2.create_subnet(
                    VpcId=vpc_id,
                    CidrBlock=f'10.0.{i+20}.0/28',
                    AvailabilityZone=az['ZoneName'],
                    TagSpecifications=[{
                        'ResourceType': 'subnet',
                        'Tags': [
                            {'Key': 'Name', 'Value': f'QuestionBank-DB-{i+1}'},
                            {'Key': 'Type', 'Value': 'Database'}
                        ]
                    }]
                )
                subnet_id = subnet_response['Subnet']['SubnetId']
                subnets[f'db_{i+1}'] = subnet_id
                print(f"✅ Database subnet {i+1} created: {subnet_id}")
            
            # Create NAT Gateways
            nat_gateways = []
            for i in range(2):
                # Allocate Elastic IP
                eip_response = self.ec2.allocate_address(Domain='vpc')
                allocation_id = eip_response['AllocationId']
                
                # Create NAT Gateway
                nat_response = self.ec2.create_nat_gateway(
                    SubnetId=subnets[f'public_{i+1}'],
                    AllocationId=allocation_id,
                    TagSpecifications=[{
                        'ResourceType': 'nat-gateway',
                        'Tags': [{'Key': 'Name', 'Value': f'QuestionBank-NAT-{i+1}'}]
                    }]
                )
                nat_id = nat_response['NatGateway']['NatGatewayId']
                nat_gateways.append(nat_id)
                print(f"✅ NAT Gateway {i+1} created: {nat_id}")
            
            # Wait for NAT Gateways to be available
            print("⏳ Waiting for NAT Gateways to be available...")
            for nat_id in nat_gateways:
                waiter = self.ec2.get_waiter('nat_gateway_available')
                waiter.wait(NatGatewayIds=[nat_id])
            
            # Create route tables
            self.create_route_tables(vpc_id, igw_id, subnets, nat_gateways)
            
            return {
                'vpc_id': vpc_id,
                'igw_id': igw_id,
                'subnets': subnets,
                'nat_gateways': nat_gateways
            }
            
        except Exception as e:
            print(f"❌ Error creating VPC: {e}")
            raise

    def create_route_tables(self, vpc_id: str, igw_id: str, subnets: Dict[str, str], nat_gateways: List[str]):
        """Create and configure route tables"""
        print("\n🛣️ Creating route tables...")
        
        # Public route table
        public_rt_response = self.ec2.create_route_table(
            VpcId=vpc_id,
            TagSpecifications=[{
                'ResourceType': 'route-table',
                'Tags': [{'Key': 'Name', 'Value': 'QuestionBank-Public-RT'}]
            }]
        )
        public_rt_id = public_rt_response['RouteTable']['RouteTableId']
        
        # Add route to Internet Gateway
        self.ec2.create_route(
            RouteTableId=public_rt_id,
            DestinationCidrBlock='0.0.0.0/0',
            GatewayId=igw_id
        )
        
        # Associate public subnets
        for i in range(2):
            self.ec2.associate_route_table(
                RouteTableId=public_rt_id,
                SubnetId=subnets[f'public_{i+1}']
            )
        
        print(f"✅ Public route table created: {public_rt_id}")
        
        # Private route tables (one per AZ)
        for i in range(2):
            private_rt_response = self.ec2.create_route_table(
                VpcId=vpc_id,
                TagSpecifications=[{
                    'ResourceType': 'route-table',
                    'Tags': [{'Key': 'Name', 'Value': f'QuestionBank-Private-RT-{i+1}'}]
                }]
            )
            private_rt_id = private_rt_response['RouteTable']['RouteTableId']
            
            # Add route to NAT Gateway
            self.ec2.create_route(
                RouteTableId=private_rt_id,
                DestinationCidrBlock='0.0.0.0/0',
                NatGatewayId=nat_gateways[i]
            )
            
            # Associate private subnet
            self.ec2.associate_route_table(
                RouteTableId=private_rt_id,
                SubnetId=subnets[f'private_{i+1}']
            )
            
            print(f"✅ Private route table {i+1} created: {private_rt_id}")

    def create_security_groups(self, vpc_id: str) -> Dict[str, str]:
        """Create security groups for different components"""
        print("\n🛡️ Creating security groups...")
        
        security_groups = {}
        
        # ALB Security Group
        alb_sg_response = self.ec2.create_security_group(
            GroupName='QuestionBank-ALB-SG',
            Description='Security group for Application Load Balancer',
            VpcId=vpc_id,
            TagSpecifications=[{
                'ResourceType': 'security-group',
                'Tags': [{'Key': 'Name', 'Value': 'QuestionBank-ALB-SG'}]
            }]
        )
        alb_sg_id = alb_sg_response['GroupId']
        security_groups['alb'] = alb_sg_id
        
        # Add inbound rules for ALB
        self.ec2.authorize_security_group_ingress(
            GroupId=alb_sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 80,
                    'ToPort': 80,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'HTTP from anywhere'}]
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 443,
                    'ToPort': 443,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'HTTPS from anywhere'}]
                }
            ]
        )
        print(f"✅ ALB Security Group created: {alb_sg_id}")
        
        # ECS Security Group
        ecs_sg_response = self.ec2.create_security_group(
            GroupName='QuestionBank-ECS-SG',
            Description='Security group for ECS tasks',
            VpcId=vpc_id,
            TagSpecifications=[{
                'ResourceType': 'security-group',
                'Tags': [{'Key': 'Name', 'Value': 'QuestionBank-ECS-SG'}]
            }]
        )
        ecs_sg_id = ecs_sg_response['GroupId']
        security_groups['ecs'] = ecs_sg_id
        
        # Add inbound rule from ALB
        self.ec2.authorize_security_group_ingress(
            GroupId=ecs_sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 3001,
                    'ToPort': 3001,
                    'UserIdGroupPairs': [{'GroupId': alb_sg_id, 'Description': 'From ALB'}]
                }
            ]
        )
        print(f"✅ ECS Security Group created: {ecs_sg_id}")
        
        # RDS Security Group
        rds_sg_response = self.ec2.create_security_group(
            GroupName='QuestionBank-RDS-SG',
            Description='Security group for RDS database',
            VpcId=vpc_id,
            TagSpecifications=[{
                'ResourceType': 'security-group',
                'Tags': [{'Key': 'Name', 'Value': 'QuestionBank-RDS-SG'}]
            }]
        )
        rds_sg_id = rds_sg_response['GroupId']
        security_groups['rds'] = rds_sg_id
        
        # Add inbound rule from ECS
        self.ec2.authorize_security_group_ingress(
            GroupId=rds_sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 1433,
                    'ToPort': 1433,
                    'UserIdGroupPairs': [{'GroupId': ecs_sg_id, 'Description': 'From ECS'}]
                }
            ]
        )
        print(f"✅ RDS Security Group created: {rds_sg_id}")
        
        return security_groups

    def run_workshop_setup(self):
        """Run the complete workshop setup"""
        print("🎯 Starting AWS Workshop Setup for Question Bank System")
        print("=" * 60)
        
        try:
            # Check prerequisites
            if not self.check_prerequisites():
                print("❌ Prerequisites not met. Please install missing tools.")
                return False
            
            # Phase 1: Network Infrastructure
            print("\n📋 PHASE 1: Network Infrastructure")
            network_info = self.create_vpc_and_subnets()
            
            # Phase 2: Security Groups
            print("\n🛡️ PHASE 2: Security Groups")
            security_groups = self.create_security_groups(network_info['vpc_id'])
            
            # Save configuration for next phases
            config = {
                'account_id': self.account_id,
                'region': self.region,
                'network': network_info,
                'security_groups': security_groups,
                'timestamp': datetime.now().isoformat()
            }
            
            with open('aws-workshop-config.json', 'w') as f:
                json.dump(config, f, indent=2)
            
            print("\n🎉 Phase 1 & 2 completed successfully!")
            print("📋 Configuration saved to: aws-workshop-config.json")
            print("\n📋 Next steps:")
            print("1. Run database setup: python aws-workshop-setup.py --phase database")
            print("2. Run container setup: python aws-workshop-setup.py --phase containers")
            print("3. Run application deployment: python aws-workshop-setup.py --phase deploy")
            
            return True
            
        except Exception as e:
            print(f"❌ Workshop setup failed: {e}")
            return False

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='AWS Workshop Setup for Question Bank System')
    parser.add_argument('--region', default='ap-southeast-1', help='AWS region')
    parser.add_argument('--phase', choices=['network', 'database', 'containers', 'deploy'], 
                       default='network', help='Setup phase to run')
    
    args = parser.parse_args()
    
    setup = AWSWorkshopSetup(region=args.region)
    
    if args.phase == 'network':
        success = setup.run_workshop_setup()
        sys.exit(0 if success else 1)
    else:
        print(f"Phase '{args.phase}' will be implemented in next iteration")
        print("For now, run: python aws-workshop-setup.py --phase network")

if __name__ == "__main__":
    main()
