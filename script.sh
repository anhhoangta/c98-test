#!/bin/bash

# Load the environment variables from the .env file
source .env

# Set the paths to the uploads and db directories.
uploads_dir="$UPLOADS_DIR"
# The SQLITE_FILE contains the file name of the SQLite database, just get the path
db_dir=$(dirname "$SQLITE_FILE")

# Set the name of the S3 bucket
# s3_bucket_name="$S3_BUCKET_NAME"

# Create the uploads directory
mkdir -p "$uploads_dir"

# Create the db directory
mkdir -p "$db_dir"

# Create the S3 bucket
# aws s3api create-bucket --bucket "$s3_bucket_name" --region us-east-1
