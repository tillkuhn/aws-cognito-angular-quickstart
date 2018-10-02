#!/usr/bin/env bash
aws dynamodb batch-write-item --request-items file://samples/ddb-dishes.json --profile yummy --region eu-central-1
