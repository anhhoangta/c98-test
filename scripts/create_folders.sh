#!/bin/bash

# Load the environment variables from the .env file
source .env

# Create the uploads directory
mkdir -p "$UPLOADS_DIR"

# Create the test directory
mkdir -p "$TEST_DIR"

# Create the S3 bucket
# aws s3api create-bucket --bucket "$s3_bucket_name" --region us-east-1
