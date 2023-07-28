#!/bin/bash

# Set the region
export AWS_DEFAULT_REGION="us-east-1"

# Set the secret name and value
SECRET_NAME="db-credentials"

# Delete the secret
aws secretsmanager delete-secret --secret-id "$SECRET_NAME" --force-delete-without-recovery