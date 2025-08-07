#!/usr/bin/env python3
"""
AWS Workshop Cleanup Automation
Automated cleanup scripts for Question Bank System

Author: Linh Dang Dev
Date: 2025-08-03
"""

import boto3
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Optional

class AWSWorkshopCleanup:
    def __init__(self, region: str = "ap-southeast-1"):
        self.region = region
        self.session = boto3.Session(region_name=region)
        
        # Initialize AWS clients
        self.ec2 = self.session.client('ec2')
        self.rds = self.session.client('rds')
        self.ecs = self.session.client('ecs')
        self.ecr = self.session.client('ecr')
        self.elbv2 = self.session.client('elbv2')
        self.s3 = self.session.client('s3')
        self.cloudformation = self.session.client('cloudformation')
        
        print(f"🧹 AWS Workshop Cleanup initialized")
        print(f"📍 Region: {self.region}")

    def daily_stop(self) -> bool:
        """Daily stop - minimal cost impact, quick restart"""
        print("\n🛑 Daily Stop - Stopping services to minimize costs...")
        
        try:
            # Stop RDS Database
            print("⏸️ Stopping RDS database...")
            try:
                self.rds.stop_db_instance(
                    DBInstanceIdentifier='questionbank-database'
                )
                print("✅ RDS database stop initiated")
            except Exception as e:
                if "InvalidDBInstanceState" in str(e):
                    print("ℹ️ RDS database already stopped")
                else:
                    print(f"⚠️ Could not stop RDS: {e}")
            
            # Scale ECS Service to 0
            print("📉 Scaling ECS service to 0 tasks...")
            try:
                self.ecs.update_service(
                    cluster='question-bank-cluster',
                    service='question-bank-service',
                    desiredCount=0
                )
                print("✅ ECS service scaled to 0 tasks")
            except Exception as e:
                print(f"⚠️ Could not scale ECS service: {e}")
            
            # Calculate savings
            daily_savings = 2.66  # RDS + ECS costs per day
            print(f"\n💰 Daily savings: ~${daily_savings:.2f}")
            print("⏱️ Restart time: ~5 minutes")
            print("🔄 Services can be restarted quickly when needed")
            
            return True
            
        except Exception as e:
            print(f"❌ Daily stop failed: {e}")
            return False

    def temporary_cleanup(self) -> bool:
        """Temporary cleanup - delete expensive resources, keep infrastructure"""
        print("\n🧹 Temporary Cleanup - Deleting expensive resources...")
        
        try:
            # First do daily stop
            self.daily_stop()
            time.sleep(5)
            
            # Delete NAT Gateways (most expensive)
            print("\n🗑️ Deleting NAT Gateways...")
            nat_gateways = self.ec2.describe_nat_gateways(
                Filters=[
                    {'Name': 'tag:Name', 'Values': ['QuestionBank-NAT-*']},
                    {'Name': 'state', 'Values': ['available']}
                ]
            )
            
            deleted_nats = []
            for nat in nat_gateways['NatGateways']:
                nat_id = nat['NatGatewayId']
                try:
                    self.ec2.delete_nat_gateway(NatGatewayId=nat_id)
                    deleted_nats.append(nat_id)
                    print(f"✅ Deleted NAT Gateway: {nat_id}")
                except Exception as e:
                    print(f"⚠️ Could not delete NAT Gateway {nat_id}: {e}")
            
            # Wait for NAT Gateways to be deleted before releasing EIPs
            if deleted_nats:
                print("⏳ Waiting for NAT Gateways to be deleted...")
                time.sleep(30)
            
            # Release Elastic IPs
            print("🗑️ Releasing unused Elastic IPs...")
            eips = self.ec2.describe_addresses()
            for eip in eips['Addresses']:
                if 'AssociationId' not in eip:  # Unassociated EIP
                    try:
                        self.ec2.release_address(AllocationId=eip['AllocationId'])
                        print(f"✅ Released EIP: {eip['PublicIp']}")
                    except Exception as e:
                        print(f"⚠️ Could not release EIP {eip['PublicIp']}: {e}")
            
            # Save deleted resources info for recreation
            cleanup_info = {
                'timestamp': datetime.now().isoformat(),
                'deleted_nat_gateways': deleted_nats,
                'cleanup_type': 'temporary'
            }
            
            with open('cleanup-info.json', 'w') as f:
                json.dump(cleanup_info, f, indent=2)
            
            daily_savings = 17.78  # RDS + ECS + NAT Gateways
            print(f"\n💰 Daily savings: ~${daily_savings:.2f}")
            print("⏱️ Recreation time: ~15 minutes")
            print("📋 Cleanup info saved to: cleanup-info.json")
            
            return True
            
        except Exception as e:
            print(f"❌ Temporary cleanup failed: {e}")
            return False

    def complete_cleanup(self, confirm: bool = False) -> bool:
        """Complete cleanup - delete ALL resources"""
        if not confirm:
            print("\n⚠️ WARNING: This will delete ALL workshop resources!")
            print("This action cannot be undone!")
            response = input("Type 'DELETE' to confirm: ")
            if response != 'DELETE':
                print("❌ Cleanup cancelled")
                return False
        
        print("\n🗑️ Complete Cleanup - Deleting ALL resources...")
        
        try:
            # Delete ECS Service and Cluster
            print("🗑️ Deleting ECS resources...")
            try:
                # Scale service to 0 first
                self.ecs.update_service(
                    cluster='question-bank-cluster',
                    service='question-bank-service',
                    desiredCount=0
                )
                time.sleep(30)
                
                # Delete service
                self.ecs.delete_service(
                    cluster='question-bank-cluster',
                    service='question-bank-service',
                    force=True
                )
                print("✅ ECS service deleted")
                
                # Wait for service deletion
                time.sleep(60)
                
                # Delete cluster
                self.ecs.delete_cluster(cluster='question-bank-cluster')
                print("✅ ECS cluster deleted")
                
            except Exception as e:
                print(f"⚠️ ECS cleanup error: {e}")
            
            # Delete Load Balancer
            print("🗑️ Deleting Load Balancer...")
            try:
                albs = self.elbv2.describe_load_balancers()
                for alb in albs['LoadBalancers']:
                    if 'QuestionBank' in alb['LoadBalancerName']:
                        self.elbv2.delete_load_balancer(
                            LoadBalancerArn=alb['LoadBalancerArn']
                        )
                        print(f"✅ Deleted ALB: {alb['LoadBalancerName']}")
            except Exception as e:
                print(f"⚠️ ALB cleanup error: {e}")
            
            # Delete Target Groups
            print("🗑️ Deleting Target Groups...")
            try:
                tgs = self.elbv2.describe_target_groups()
                for tg in tgs['TargetGroups']:
                    if 'QuestionBank' in tg['TargetGroupName']:
                        self.elbv2.delete_target_group(
                            TargetGroupArn=tg['TargetGroupArn']
                        )
                        print(f"✅ Deleted Target Group: {tg['TargetGroupName']}")
            except Exception as e:
                print(f"⚠️ Target Group cleanup error: {e}")
            
            # Delete RDS Database
            print("🗑️ Deleting RDS Database...")
            try:
                self.rds.delete_db_instance(
                    DBInstanceIdentifier='questionbank-database',
                    SkipFinalSnapshot=True,
                    DeleteAutomatedBackups=True
                )
                print("✅ RDS database deletion initiated")
            except Exception as e:
                print(f"⚠️ RDS cleanup error: {e}")
            
            # Delete S3 Buckets
            print("🗑️ Deleting S3 Buckets...")
            try:
                buckets = self.s3.list_buckets()
                for bucket in buckets['Buckets']:
                    if 'questionbank' in bucket['Name'].lower():
                        # Empty bucket first
                        try:
                            objects = self.s3.list_objects_v2(Bucket=bucket['Name'])
                            if 'Contents' in objects:
                                delete_objects = [{'Key': obj['Key']} for obj in objects['Contents']]
                                self.s3.delete_objects(
                                    Bucket=bucket['Name'],
                                    Delete={'Objects': delete_objects}
                                )
                            
                            # Delete bucket
                            self.s3.delete_bucket(Bucket=bucket['Name'])
                            print(f"✅ Deleted S3 bucket: {bucket['Name']}")
                        except Exception as e:
                            print(f"⚠️ Could not delete bucket {bucket['Name']}: {e}")
            except Exception as e:
                print(f"⚠️ S3 cleanup error: {e}")
            
            # Delete ECR Repository
            print("🗑️ Deleting ECR Repository...")
            try:
                self.ecr.delete_repository(
                    repositoryName='question-bank-backend',
                    force=True
                )
                print("✅ ECR repository deleted")
            except Exception as e:
                print(f"⚠️ ECR cleanup error: {e}")
            
            # Delete Security Groups and VPC (will be done last)
            print("🗑️ Deleting Security Groups...")
            time.sleep(120)  # Wait for resources to be deleted
            
            try:
                # Get VPC ID
                vpcs = self.ec2.describe_vpcs(
                    Filters=[{'Name': 'tag:Name', 'Values': ['QuestionBank-VPC']}]
                )
                
                if vpcs['Vpcs']:
                    vpc_id = vpcs['Vpcs'][0]['VpcId']
                    
                    # Delete security groups in order
                    sg_names = ['QuestionBank-ECS-SG', 'QuestionBank-RDS-SG', 'QuestionBank-ALB-SG']
                    for sg_name in sg_names:
                        try:
                            sgs = self.ec2.describe_security_groups(
                                Filters=[
                                    {'Name': 'group-name', 'Values': [sg_name]},
                                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                                ]
                            )
                            for sg in sgs['SecurityGroups']:
                                self.ec2.delete_security_group(GroupId=sg['GroupId'])
                                print(f"✅ Deleted Security Group: {sg_name}")
                        except Exception as e:
                            print(f"⚠️ Could not delete SG {sg_name}: {e}")
                    
                    # Delete VPC
                    time.sleep(30)
                    try:
                        self.ec2.delete_vpc(VpcId=vpc_id)
                        print("✅ VPC deleted")
                    except Exception as e:
                        print(f"⚠️ VPC cleanup error: {e}")
                        
            except Exception as e:
                print(f"⚠️ VPC/SG cleanup error: {e}")
            
            # Save cleanup record
            cleanup_record = {
                'timestamp': datetime.now().isoformat(),
                'cleanup_type': 'complete',
                'status': 'completed'
            }
            
            with open('complete-cleanup-record.json', 'w') as f:
                json.dump(cleanup_record, f, indent=2)
            
            print("\n🎉 Complete cleanup finished!")
            print("💰 All AWS charges stopped")
            print("📋 Cleanup record saved")
            print("\n⚠️ Note: Some resources may take a few minutes to fully delete")
            print("💡 Check AWS Console to verify all resources are deleted")
            
            return True
            
        except Exception as e:
            print(f"❌ Complete cleanup failed: {e}")
            return False

    def cost_estimate(self) -> Dict[str, float]:
        """Estimate current daily costs"""
        print("\n💰 Estimating current daily costs...")
        
        costs = {
            'rds': 0.0,
            'ecs': 0.0,
            'alb': 3.78,  # Always running
            'nat': 0.0,
            's3': 0.14,   # Minimal
            'cloudwatch': 0.50,
            'total': 0.0
        }
        
        try:
            # Check RDS status
            try:
                rds_instances = self.rds.describe_db_instances(
                    DBInstanceIdentifier='questionbank-database'
                )
                if rds_instances['DBInstances'][0]['DBInstanceStatus'] == 'available':
                    costs['rds'] = 0.408  # Per day
                    print("📊 RDS: Running - $0.41/day")
                else:
                    print("📊 RDS: Stopped - $0.00/day")
            except:
                print("📊 RDS: Not found - $0.00/day")
            
            # Check ECS tasks
            try:
                services = self.ecs.describe_services(
                    cluster='question-bank-cluster',
                    services=['question-bank-service']
                )
                if services['services']:
                    running_tasks = services['services'][0]['runningCount']
                    costs['ecs'] = running_tasks * 1.18  # Per task per day
                    print(f"📊 ECS: {running_tasks} tasks - ${costs['ecs']:.2f}/day")
                else:
                    print("📊 ECS: No tasks - $0.00/day")
            except:
                print("📊 ECS: Not found - $0.00/day")
            
            # Check NAT Gateways
            try:
                nat_gateways = self.ec2.describe_nat_gateways(
                    Filters=[{'Name': 'state', 'Values': ['available']}]
                )
                nat_count = len(nat_gateways['NatGateways'])
                costs['nat'] = nat_count * 1.08  # Per NAT per day
                print(f"📊 NAT Gateways: {nat_count} gateways - ${costs['nat']:.2f}/day")
            except:
                print("📊 NAT Gateways: Not found - $0.00/day")
            
            costs['total'] = sum(costs.values())
            
            print(f"\n💰 Total estimated daily cost: ${costs['total']:.2f}")
            print(f"📅 Weekly estimate: ${costs['total'] * 7:.2f}")
            print(f"📅 Monthly estimate: ${costs['total'] * 30:.2f}")
            
            return costs
            
        except Exception as e:
            print(f"❌ Cost estimation failed: {e}")
            return costs

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='AWS Workshop Cleanup Automation')
    parser.add_argument('--action', choices=['daily-stop', 'temp-cleanup', 'complete-cleanup', 'cost-estimate'], 
                       required=True, help='Cleanup action to perform')
    parser.add_argument('--region', default='ap-southeast-1', help='AWS region')
    parser.add_argument('--confirm', action='store_true', help='Skip confirmation prompts')
    
    args = parser.parse_args()
    
    cleanup = AWSWorkshopCleanup(region=args.region)
    
    if args.action == 'daily-stop':
        success = cleanup.daily_stop()
    elif args.action == 'temp-cleanup':
        success = cleanup.temporary_cleanup()
    elif args.action == 'complete-cleanup':
        success = cleanup.complete_cleanup(confirm=args.confirm)
    elif args.action == 'cost-estimate':
        cleanup.cost_estimate()
        success = True
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
