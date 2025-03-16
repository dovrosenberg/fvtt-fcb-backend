#!/bin/bash

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ ERROR: .env file not found! Please download and edit the environment variables first.  See the README for details."
    exit 1
fi

# Check if service account key file exists
if [ ! -f "gcp-service-key.json" ]; then
    echo "❌ ERROR: Service account key file 'gcp-service-key.json' not found!"
    echo "Please download your GCP service account key and place it in this directory - see README for more info."
    exit 1
fi

# Authenticate with Google Cloud
echo "Logging in to GCP..."
gcloud auth activate-service-account --key-file=gcp-service-key.json

# Set the Google Cloud Project
echo "Setting up..."
gcloud config set project $GCP_PROJECT_ID

# Deploy the container from GitHub Container Registry
echo "Deploying container..."
IMAGE_NAME="ghcr.io/dovrosenberg/ffvtt-fcb-backend:latest"
gcloud run deploy foundry-backend --image $IMAGE_NAME --platform managed --region us-central1 --allow-unauthenticated

# Set environment variables in the deployed container
echo "set env"
gcloud run services update foundry-backend \
    --set-env-vars FOUNDRY_API_TOKEN=$FOUNDRY_API_TOKEN,AI_API_KEY=$AI_API_KEY

# Output success message
echo "✅ Deployment complete! Your Foundry Campaign Builder backend is now live."
echo "See README for final configuration steps."
