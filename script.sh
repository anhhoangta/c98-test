#!/bin/bash

# Load the environment variables from the .env file
source .env

# The SQLITE_FILE contains the file name of the SQLite database, just get the path
db_dir=$(dirname "$SQLITE_FILE")

# Set the name of the S3 bucket
# s3_bucket_name="$S3_BUCKET_NAME"

# Create the uploads directory
mkdir -p "$UPLOADS_DIR"

# Create the db directory
mkdir -p "$db_dir"

# Create the test directory
mkdir -p "$TEST_DIR"

# Create the S3 bucket
# aws s3api create-bucket --bucket "$s3_bucket_name" --region us-east-1
