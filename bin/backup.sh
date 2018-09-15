#!/usr/bin/env bash
set -x
aws dynamodb scan --table-name yummy-dish --profile yummy --region eu-central-1  >backup-dish.json
aws s3 cp backup-dish.json  s3://timafe-docs --profile yummy --region eu-central-1
