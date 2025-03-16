#!/bin/bash

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ ERROR: .env file not found! Please download and edit the environment variables first.  See the README for details."
    exit 1
fi

# Authenticate with Google Cloud
gcloud auth login

# Set the Google Cloud Project
gcloud config set project $GCP_PROJECT_ID

# Deploy the container from GitHub Container Registry
IMAGE_NAME="ghcr.io/dovrosenberg/ffvtt-fcb-backend:latest"
gcloud run deploy foundry-backend --image $IMAGE_NAME --platform managed --region us-central1 --allow-unauthenticated

# Set environment variables in the deployed container
gcloud run services update foundry-backend \
    --set-env-vars FOUNDRY_API_TOKEN=$FOUNDRY_API_TOKEN,AI_API_KEY=$AI_API_KEY

# Output success message
echo "✅ Deployment complete! Your Foundry Campaign Builder backend is now live."
echo "See README for final configuration steps."
