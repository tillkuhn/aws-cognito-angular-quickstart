#!/usr/bin/env bash
echo "Starting localstack dynamodb service on http://localhost:4569"
SERVICES=dynamodb localstack start

