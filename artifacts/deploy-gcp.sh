#!/bin/bash

# Load environment variables from .env file
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
else
    echo "❌ ERROR: .env file not found! Please download and edit the environment variables first.  See the README for details."
    exit 1
fi

# Check for required dependencies
echo "Checking for required dependencies..."

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ ERROR: $1 is not installed."
        return 1
    fi
    return 0
}

# Check each required dependency
MISSING_DEPS=()
check_command "gcloud" || MISSING_DEPS+=("gcloud")
check_command "openssl" || MISSING_DEPS+=("openssl")
check_command "jq" || MISSING_DEPS+=("jq")
check_command "curl" || MISSING_DEPS+=("curl")

# If any dependencies are missing, show installation instructions
if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo "❌ Missing dependencies: ${MISSING_DEPS[*]}"
    echo
    echo "Please install the missing dependencies using one of these commands:"
    echo
    echo "Visit https://cloud.google.com/sdk/docs/install for gcloud installation"
    echo
    echo "For Ubuntu/Debian:"
    echo "sudo apt-get update && sudo apt-get install -y openssl jq curl"
    echo
    echo "For macOS:"
    echo "brew install openssl jq curl"
    echo
    exit 1
fi

echo "✅ All required dependencies are installed."

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

# Function to check if a bucket exists and if we own it
check_bucket_ownership() {
    local bucket_name=$1
    echo "Checking ownership of bucket: $bucket_name"

    local output
    output=$(gcloud storage buckets describe "gs://$bucket_name" --format="value(name)" 2>&1)
    local exit_code=$?

    if gcloud storage buckets describe gs://"$bucket_name" &>/dev/null; then
        echo "Bucket exists"
        return 0  # Bucket exists
    else
        echo "Bucket does not exist"
        return 1  # Bucket doesn't exist
    fi
}

# Create a Cloud Storage bucket if it doesn't exist
check_bucket_ownership "$GCS_BUCKET_NAME"
BUCKET_STATUS=$?

case $BUCKET_STATUS in
    0)
        echo "✅ Cloud Storage bucket $GCS_BUCKET_NAME already exists."
        ;;
    1)
        echo "Creating Cloud Storage bucket: $GCS_BUCKET_NAME..."

        # Create a pipe to capture both output and exit status
        set -o pipefail

        if ! gcloud storage buckets create gs://$GCS_BUCKET_NAME --location=$GCP_REGION 2>&1 | tee /tmp/bucket_create.log; then
            if grep -q "HTTPError 409" /tmp/bucket_create.log; then
                echo "❌ ERROR: The bucket name '$GCS_BUCKET_NAME' is already in use.  GCS bucket names have to be unique globally (not just within your project)."
                echo "Please choose a different bucket name in your .env file and try again."
                rm /tmp/bucket_create.log
                exit 1
            else
                echo "❌ Failed to create bucket $GCS_BUCKET_NAME. Please check the error message above."
                rm /tmp/bucket_create.log
                exit 1
            fi
        fi
        
        echo "✅ Bucket $GCS_BUCKET_NAME created successfully!"
        
        # Set up CORS for the bucket
        echo "Setting up CORS configuration..."
        echo '[{"origin": ["*"], "method": ["GET"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600}]' > cors.json

        if gcloud storage buckets update gs://$GCS_BUCKET_NAME --cors-file=cors.json; then
            echo "✅ CORS configuration updated successfully."
        else
            echo "❌ Failed to update CORS configuration."
            echo "Please verify that the service account has the 'Storage Admin' role and try again."
            rm cors.json
            exit 1
        fi
        rm cors.json
        ;;
esac

# Verify service account permissions
echo "Verifying service account permissions..."
SERVICE_ACCOUNT=$(gcloud config get-value account)
echo "Using service account: $SERVICE_ACCOUNT"

# Generate a Secure API Token
API_TOKEN=$(openssl rand -hex 32)  # Generate a 32-byte random token

# Encode the service account credentials in base64
GCP_CERT=$(base64 < gcp-service-key.json | tr -d '\n')

# Step: Gmail OAuth Setup
if [[ "$INCLUDE_EMAIL_SETUP" == "false" ]]; then
    echo "Gmail setup skipped due to INCLUDE_EMAIL_SETUP"
elif [[ -n "$GMAIL_REFRESH_TOKEN" ]]; then
    echo "Gmail refresh token already provided — skipping Gmail authorization."
else
    echo "Gmail refresh token not found. Starting one-time Gmail OAuth authorization..."

    # Construct consent URL
    AUTH_URL="https://accounts.google.com/o/oauth2/v2/auth?client_id=$GMAIL_CLIENT_ID&redirect_uri=http://localhost:3000/oauth2callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.modify&access_type=offline&prompt=consent"

    echo
    echo "Please open the following URL in your browser to authorize Gmail access:"
    echo "$AUTH_URL"
    echo
    echo "After authorizing, you'll be redirected to:"
    echo "    $GMAIL_REDIRECT_URI?code=XYZ..."
    echo "Copy the 'code' parameter from that URL and paste it below."
    echo

    read -p "Paste authorization code here: " AUTH_CODE

    echo "Exchanging authorization code for tokens..."

    RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
      -d "code=$AUTH_CODE" \
      -d "client_id=$GMAIL_CLIENT_ID" \
      -d "client_secret=$GMAIL_CLIENT_SECRET" \
      -d "redirect_uri=http://localhost:3000/oauth2callback" \
      -d "grant_type=authorization_code")

    GMAIL_REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token')

    if [[ "$GMAIL_REFRESH_TOKEN" == "null" || -z "$GMAIL_REFRESH_TOKEN" ]]; then
        echo "❌ ERROR: Failed to retrieve Gmail refresh token."
        echo "Response: $RESPONSE"
        exit 1
    fi

    echo
    echo "✅ Gmail authorization complete."
    echo "Please set the GMAIL_REFRESH_TOKEN in your .env file to this value:"
    echo
    echo "GMAIL_REFRESH_TOKEN=$GMAIL_REFRESH_TOKEN"
    echo
    echo "Then rerun this setup script with:"
    echo "curl -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/deploy-gcp.sh | bash"
    exit 0
fi

# Deploy the container from Docker Hub
IMAGE_NAME="docker.io/drosenberg62/fvtt-fcb-backend:REPLACE_IMAGE_TAG"  # Github release action inserts the correct tag

# Create a temporary file for environment variables
# We do it this way because inbound whitelist has commas in it and trying to do it inline was a disaster
ENV_FILE=$(mktemp)
cat > "$ENV_FILE" << EOF
GCP_PROJECT_ID: "$GCP_PROJECT_ID"
API_TOKEN: "$API_TOKEN"
OPENAI_API_KEY: "$OPENAI_API_KEY"
REPLICATE_API_KEY: "$REPLICATE_API_KEY"
GCS_BUCKET_NAME: "$GCS_BUCKET_NAME"
GCP_CERT: "$GCP_CERT"
INCLUDE_EMAIL_SETUP: "$INCLUDE_EMAIL_SETUP"
GMAIL_CLIENT_ID: "$GMAIL_CLIENT_ID"
GMAIL_CLIENT_SECRET: "$GMAIL_CLIENT_SECRET"
GMAIL_REFRESH_TOKEN: "$GMAIL_REFRESH_TOKEN"
INBOUND_WHITELIST: "$INBOUND_WHITELIST"
STORAGE_TYPE: "$STORAGE_TYPE"
AWS_BUCKET_NAME: "$AWS_BUCKET_NAME"
AWS_ACCESS_KEY_ID: "$AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY: "$AWS_SECRET_ACCESS_KEY"
AWS_REGION: "$AWS_REGION"
EOF

# Deploy the service
gcloud run deploy $GCP_PROJECT_ID \
    --image $IMAGE_NAME \
    --platform managed \
    --region $GCP_REGION \
    --allow-unauthenticated \
    --env-vars-file "$ENV_FILE"

# Clean up the temporary file
# rm "$ENV_FILE"

if [ $? -ne 0 ]; then
    echo "Cloud run deploy failed"
    exit 1
fi

# Get the URL and update the service
echo "Getting service URL..."
SERVER_URL=$(gcloud run services describe $GCP_PROJECT_ID \
    --platform managed \
    --region=$GCP_REGION \
    --format "value(status.url)")

# Update just the SERVER_URL environment variable
echo "Updating service with correct URL..."
gcloud run services update $GCP_PROJECT_ID \
    --platform managed \
    --region=$GCP_REGION \
    --update-env-vars SERVER_URL=$SERVER_URL

# Output success message
echo "✅ Deployment complete! Your Foundry Campaign Builder backend is now live."
echo "Use these settings in "Advanced Settings" for the module:"
echo "URL: $SERVER_URL"
echo "API Token: $API_TOKEN"
echo "See README for final configuration steps."
