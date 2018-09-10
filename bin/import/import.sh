#!/usr/bin/env bash
aws dynamodb batch-write-item --request-items file://ddb-dishes.json --profile yummy --region eu-central-1