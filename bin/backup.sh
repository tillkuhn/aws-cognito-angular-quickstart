#!/usr/bin/env bash
set -x
aws dynamodb scan --table-name yummy-dish --profile yummy --region eu-central-1  >dish.backup
aws dynamodb scan --table-name yummy-dish --profile yummy --region eu-central-1  >place.backup
aws s3 cp dish.backup  s3://timafe-docs --profile yummy --region eu-central-1
aws s3 cp place.backup  s3://timafe-docs --profile yummy --region eu-central-1
