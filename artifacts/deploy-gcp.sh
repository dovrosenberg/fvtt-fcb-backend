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
if ! gcloud storage buckets list --format="value(name)" | grep -q "^$GCS_BUCKET_NAME$"; then
    echo "📦 Creating Cloud Storage bucket: $GCS_BUCKET_NAME..."
    gcloud storage buckets create gs://$GCS_BUCKET_NAME --location=$GCP_REGION
    echo "✅ Bucket $GCS_BUCKET_NAME created successfully!"
else
    echo "✅ Cloud Storage bucket $GCS_BUCKET_NAME already exists."
fi

# # Check if the Cloud Run service exists
# # If it does, for some reason it won't deploy the new revision
# SERVICE_NAME="fvtt-fcb-backend"
# EXISTING_SERVICE=$(gcloud run services list --platform managed --filter "metadata.name=${SERVICE_NAME}" --format="value(metadata.name)")

# if [ "$EXISTING_SERVICE" = "$SERVICE_NAME" ]; then
#     echo "🛑 Deleting existing Cloud Run service: $SERVICE_NAME..."
#     gcloud run services delete $SERVICE_NAME --platform managed --region $GCP_REGION --quiet
# fi

# ✅ Generate a Secure API Token
API_TOKEN=$(openssl rand -hex 32)  # Generate a 32-byte random token

# ✅ Encode the service account credentials in base64
GCP_CERT=$(base64 < gcp-service-key.json)

# Deploy the container from Docker Hub
echo "Deploying container..."
IMAGE_NAME="docker.io/drosenberg62/fvtt-fcb-backend:REPLACE_IMAGE_TAG"  # Github release action inserts the correct tag

# get the deploy URL
SERVER_URL=$(gcloud run services describe fvtt-fcb-backend \
  --platform managed \
  --region=us-central1 \
  --format "value(status.url)")

# Prepare environment variables
ENV_VARS="\
GCP_PROJECT_ID=${GCP_PROJECT_ID:-},\
API_TOKEN=${API_TOKEN:-},\
OPENAI_API_KEY=${OPENAI_API_KEY:-},\
REPLICATE_API_KEY=${REPLICATE_API_KEY:-},\
GCS_BUCKET_NAME=${GCS_BUCKET_NAME:-},\
GCP_CERT=\"$GCP_CERT\",\
STORAGE_TYPE=${STORAGE_TYPE:-},\
AWS_BUCKET_NAME=${AWS_BUCKET_NAME:-},\
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-},\
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-},\
AWS_REGION=${AWS_REGION:-},\
SERVER_URL=${SERVER_URL:-}"

gcloud run deploy fvtt-fcb-backend \
    --image $IMAGE_NAME \
    --platform managed \
    --region $GCP_REGION \
    --allow-unauthenticated \
    --set-env-vars "$ENV_VARS"

if [ $? -ne 0 ]; then
  echo "Cloud run deploy failed"
  exit 1
fi

# Output success message
echo "✅ Deployment complete! Your Foundry Campaign Builder backend is now live."
echo "Use these settings in "Advanced Settings" for the module:"
echo "URL: $SERVER_URL"
echo "API Token: $API_TOKEN"
echo "See README for final configuration steps."
