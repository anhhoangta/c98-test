#!/bin/bash

# Load the environment variables from the .env file
source .env

# Create the uploads directory
mkdir -p "$UPLOADS_DIR"
