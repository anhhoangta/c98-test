#!/bin/bash

# Set the region
export AWS_DEFAULT_REGION="us-east-1"

# Set the secret name and value
DB_SECRET_NAME="db-credentials"
DB_SECRET_VALUE=$(printf '{"db_host":"%s","db_port":"%s","db_name":"%s","db_username":"%s","db_password":"%s"}' "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USER" "$DB_PASSWORD")

AWS_SECRET_NAME="aws-credentials"
AWS_SECRET_VALUE=$(printf '{"AWS_ACCESS_KEY_ID":"%s","AWS_SECRET_ACCESS_KEY":"%s"}' "$AWS_ACCESS_KEY_ID" "$AWS_SECRET_ACCESS_KEY")

REDIS_SECRET_NAME="redis-credentials"
REDIS_SECRET_VALUE=$(printf '{"REDIS_HOST":"%s","REDIS_PORT":"%s"}' "$REDIS_HOST" "$REDIS_PORT")

# Check if the secret exists. If not create the secret.
aws secretsmanager describe-secret --secret-id "$DB_SECRET_NAME" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "The secret $DB_SECRET_NAME already exists."
else
    echo "The secret $DB_SECRET_NAME does not exist. Creating the secret..."
    aws secretsmanager create-secret --name "$DB_SECRET_NAME" --secret-string "$DB_SECRET_VALUE"
fi

# Check if the db secret exists. If not create the secret.
aws secretsmanager describe-secret --secret-id "$AWS_SECRET_NAME" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "The secret $AWS_SECRET_NAME already exists."
else
    echo "The secret $AWS_SECRET_NAME does not exist. Creating the secret..."
    aws secretsmanager create-secret --name "$AWS_SECRET_NAME" --secret-string "$AWS_SECRET_VALUE"
fi 

# Check if the redis secret exists. If not create the secret.
aws secretsmanager describe-secret --secret-id "$REDIS_SECRET_NAME" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "The secret $REDIS_SECRET_NAME already exists."
else
    echo "The secret $REDIS_SECRET_NAME does not exist. Creating the secret..."
    aws secretsmanager create-secret --name "$REDIS_SECRET_NAME" --secret-string "$REDIS_SECRET_VALUE"
fi

