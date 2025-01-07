# TODO: convert to proper class (OOP) to make it easier to maintain
"""Deploy Apps services

This function will deploy the Apps services in a loop providing
no downtime to the application.

It will first deregister the instances from the target group and
will then delete the stack. It will then deploy the stack again with the new
version and register the instances to the target group.

In case of an error, the script will exit if the waiter for
register_complete_waiter is not successful.

Args:
    None

Returns:
    None
"""
import subprocess
import sys
from pathlib import Path
from time import sleep

import boto3
import botocore

# Constants declaration
INSTANCE_NAMES = ["AppsA1-east", "AppsB1-east", "AppsC1-east", "AppsD1-east"]
APPS_TARGET_GROUP = "arn:aws:elasticloadbalancing:us-east-1:ZONE_ID:targetgroup/Apps-ELB/ID"


def get_instance_id_from_name():
    """Get the instance ID from the instance name

    This function will look up the instance ID from the instance name.

    Args:
        None

    Returns:
        dict: Dictionary of instance names as keys and instance IDs as values
    """

    instances_id = {}

    # Create an EC2 resource object
    ec2 = boto3.resource("ec2", region_name="us-east-1")

    # Filter the instances by name
    filter_for = [
        # TODO: redeploy the stack after a failure or new stack when the instance is not running
        {"Name": "instance-state-name", "Values": ["running"]},
        {"Name": "tag:Name", "Values": INSTANCE_NAMES},
    ]

    # Loop through the instances and add them to the dictionary
    apps_instances = ec2.instances.filter(Filters=filter_for)
    for instance in apps_instances:
        for tags in instance.tags:
            if tags["Key"] == "Name":
                instances_id[tags["Value"]] = instance.id

    return instances_id


def deregister_instances(name: str, instance_id: str):
    """Deregister instances from target group

    This method will deregister a list of targets from a target port.

    Args:
        name (str): Name of the instance
        instance_id (str): Instance ID

    Returns:
        None
    """

    # Client for the ELBv2 service
    client = boto3.client("elbv2", region_name="us-east-1")

    # Deregister the instance from the target group
    client.deregister_targets(
        TargetGroupArn=APPS_TARGET_GROUP,
        Targets=[{"Id": instance_id}],
    )

    # Create a waiter object
    deregister_complete_waiter = client.get_waiter("target_deregistered")

    # Wait for the instance to be deregistered
    try:
        deregister_complete_waiter.wait(
            TargetGroupArn=APPS_TARGET_GROUP,
            Targets=[{"Id": instance_id}],
        )
        print(f"{name}:{instance_id} is now deregistered from target group")

    except botocore.exceptions.WaitError as err:
        print(err.message)


def register_instances(name: str, instance_id: str):
    """Register instances to an ELBv2

    This method will register a list of targets to a target port.

    Args:
        name (str): Name of the instance
        instance_id (str): Instance ID

    Returns:
        None
    """

    # Client for the ELBv2 service
    client = boto3.client("elbv2", region_name="us-east-1")

    # Create a waiter object
    register_complete_waiter = client.get_waiter("target_in_service")

    # Register the instance to the target group
    client.register_targets(
        TargetGroupArn=APPS_TARGET_GROUP,
        Targets=[{"Id": instance_id}],
    )

    # Wait for the instance to be registered
    try:
        register_complete_waiter.wait(
            TargetGroupArn=APPS_TARGET_GROUP,
            Targets=[{"Id": instance_id}],
        )
        print(f"{name}:{instance_id} is now registered to target group")

    # If the waiter is not successful, exit the script
    except botocore.exceptions.WaitError as err:
        print(err.message)
        sys.exit("Failed to register instance to target group. Aborting.")


def deploy_apps():
    """Deploy Apps services

    This function will deploy the Apps services.

    Args:
        None

    Returns:
        None
    """

    # Capture the current instances IDs
    current_instances = get_instance_id_from_name()
    apps_list = []
    source = Path("/home/ansible/infrastructure/apps/environ")
    # Loop through the directory and add the files names to the list
    for file in source.iterdir():
        if "Stage" not in file.name:  # Ignore the stage files
            apps_list.append(file.name)

    # Loop through the apps dictionary and deploy the apps
    for key, value in current_instances.items():
        for app in apps_list:
            # If the name of the instance is the same as the file name
            # then deploy the app, otherwise skip it
            if key == app:
                print(f"Deregistering {key}:{value} from target group\n")
                deregister_instances(key, value)
                print(f"Deleting stack {key}\n")
                subprocess.call(
                    ["./delete.sh", f"environ/{key}"],
                    cwd="/home/ansible/infrastructure/apps/",
                )
                print(f"Deploying new stack {key}\n")
                subprocess.call(
                    ["./deploy.sh", f"environ/{key}"],
                    cwd="/home/ansible/infrastructure/apps/",
                )
                sleep(30)
                print(f"Registering {key} to target group\n")
                new_instances = get_instance_id_from_name()
                print(f"New instance ID for {key}: {new_instances[key]}\n")
                register_instances(key, new_instances[key])


deploy_apps()
