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

# ✅ Create a Cloud Storage bucket if it doesn't exist
echo "🗂 Checking for Cloud Storage bucket..."
if ! gcloud storage buckets list --format="value(name)" | grep -q "^$GCP_PROJECT_ID-$GCS_BUCKET_NAME$"; then
    echo "📦 Creating Cloud Storage bucket: $GCP_PROJECT_ID-$GCS_BUCKET_NAME..."
    gcloud storage buckets create gs://$GCP_PROJECT_ID-$GCS_BUCKET_NAME --location=$GCP_REGION
    echo "✅ Bucket $GCP_PROJECT_ID-$GCS_BUCKET_NAME created successfully!"
else
    echo "✅ Cloud Storage bucket $GCP_PROJECT_ID-$GCS_BUCKET_NAME already exists."
fi

# Deploy the container from GitHub Container Registry
echo "Deploying container..."
IMAGE_NAME="docker.io/drosenberg62/fvtt-fcb-backend:latest"
gcloud run deploy fvtt-fcb-backend --image $IMAGE_NAME --platform managed --region $GCP_REGION --allow-unauthenticated

# Set environment variables in the deployed container
echo "Setting environment variables..."
gcloud run services update fvtt-fcb-backend --region $GCP_REGION \
    --set-env-vars FOUNDRY_API_TOKEN=$FOUNDRY_API_TOKEN,AI_API_KEY=$AI_API_KEY,GCS_BUCKET_NAME=$GCP_PROJECT_ID-$GCS_BUCKET_NAME

# Output success message
echo "✅ Deployment complete! Your Foundry Campaign Builder backend is now live."
echo "See README for final configuration steps."
