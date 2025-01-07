#! /bin/bash

if [ "$#" -ne 1 ]; then
  echo 'Illegal number of parameters; requires "EnvFile"'
  exit
fi

envFile=$1
source $envFile

SafeEnvName=$(echo ${EnvName} | tr . - | tr '[:upper:]' '[:lower:]')
STACK_NAME=${EnvName}-api-autoscaling

export TRANSACTION_DB
export BACKUP_TRANSACTION_DB
export READ_DB
export SERVICES_DB
export PCI_DB
export EnvName
export Region
export STACK_NAME
export GIT_TAG
export asg

userdata=$(envsubst <${userDataFile})
UserDataParam=""

if [ "$(uname)" == "Darwin" ]; then
  UserDataParam=$(echo "${userdata}" | base64 -b 0)
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  UserDataParam=$(echo "${userdata}" | base64 -w0)
fi

# echo $userdata
aws cloudformation deploy --region ${Region} --stack-name ${STACK_NAME} --template-file template.yml --capabilities CAPABILITY_NAMED_IAM --parameter-overrides \
  EnvName=${EnvName} \
  ImageId=${ImageId} \
  InstanceType=${InstanceType} \
  KeyName=${KeyName} \
  VpcId=${VpcId} \
  Subnets=${Subnets} \
  InstanceRole=${InstanceRole} \
  SafeEnvName=${SafeEnvName} \
  SNSAlert=${SNSAlert} \
  CPUUtilization=${CPUUtilization} \
  DiskSpaceUtilization=${DiskSpaceUtilization} \
  MemoryUtilization=${MemoryUtilization} \
  UserData=${UserDataParam} \
  SecurityGroupIds=${SecurityGroupIds} \
  TargetGroup=${TargetGroup}

# echo "Stack complete; tagging volumes"
# instanceId=$(aws cloudformation describe-stacks --stack-name ${EnvName}-service --query 'Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue' --output text)
# volumeCId=$(aws ec2 describe-volumes --filters Name=attachment.instance-id,Values=${instanceId} Name=attachment.device,Values='/east/sda1' --query 'Volumes[0].VolumeId' --output text)
# aws ec2 create-tags --resources ${volumeCId}  --tags "Key"="EnvName","Value"="${EnvName}-drive" "Key"="Backup","Value"="DailyBackup" "Key"="DisasterRecovery","Value"="yes"

echo "Done"
