#!/bin/bash

# Set the region
export AWS_DEFAULT_REGION="us-east-1"

# Set the secret name and value
SECRET_NAME="db-credentials"
SECRET_VALUE=$(printf '{"db_host":"%s","db_port":"%s","db_name":"%s","db_username":"%s","db_password":"%s"}' "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USER" "$DB_PASSWORD")

# Check if the secret exists. If not create the secret.
aws secretsmanager describe-secret --secret-id "$SECRET_NAME" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "The secret $SECRET_NAME already exists."
    exit 0
fi

# Create the secret. 
aws secretsmanager create-secret --name "$SECRET_NAME" --secret-string "$SECRET_VALUE"
