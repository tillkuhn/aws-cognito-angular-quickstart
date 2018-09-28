#!/usr/bin/env bash
ENVSCRIPT=$(dirname ${BASH_SOURCE[0]})/setenv.sh
if [ ! -f $ENVSCRIPT ]; then
   echo "$ENVSCRIPT not found"
   exit 1
fi
. $ENVSCRIPT

set -x
mkdir -p ${LOCAL_BACKUP}
for TABLE in dish place; do
  aws dynamodb scan --table-name ${APP_ID}-${TABLE} --profile ${AWS_PROFILE} --region eu-central-1  >${LOCAL_BACKUP}/${TABLE}.dmp
  aws s3 cp ${LOCAL_BACKUP}/${TABLE}.dmp  ${S3_BACKUP} --profile ${AWS_PROFILE} --region ${AWS_REGION}
done