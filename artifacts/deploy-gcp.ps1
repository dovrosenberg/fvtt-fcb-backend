# Check for required dependencies
Write-Host "Checking for required dependencies..."

# Function to check if a command exists
function Test-Command {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try { if (Get-Command $command) { return $true } }
    catch { return $false }
    finally { $ErrorActionPreference = $oldPreference }
}

# Check each required dependency
$missingDeps = @()
if (-not (Test-Command "gcloud")) { $missingDeps += "gcloud" }
if (-not (Test-Command "openssl")) { $missingDeps += "openssl" }
if (-not (Test-Command "jq")) { $missingDeps += "jq" }
if (-not (Test-Command "curl")) { $missingDeps += "curl" }

# If any dependencies are missing, show installation instructions
if ($missingDeps.Count -gt 0) {
    Write-Host "❌ Missing dependencies: $($missingDeps -join ', ')"
    Write-Host "\nPlease install the missing dependencies:\n"
    
    Write-Host "   - gcloud: https://cloud.google.com/sdk/docs/install"
    Write-Host "   - OpenSSL: https://slproweb.com/products/Win32OpenSSL.html"
    Write-Host "   - jq: https://stedolan.github.io/jq/download/"
    Write-Host "   - curl: https://curl.se/windows/"
    exit 1
}

Write-Host "✅ All required dependencies are installed."

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($name -and -not $name.StartsWith('#')) {
                Set-Item -Path "env:$name" -Value $value
            }
        }
    }
} else {
    Write-Host "❌ ERROR: .env file not found! See the README for details."
    exit 1
}

# Check if service account key file exists
if (-not (Test-Path "gcp-service-key.json")) {
    Write-Host "❌ ERROR: Service account key file 'gcp-service-key.json' not found!"
    exit 1
}

# Authenticate with Google Cloud
Write-Host "Logging in to GCP..."
gcloud auth activate-service-account --key-file=gcp-service-key.json

# Set the Google Cloud Project
Write-Host "Setting up..."
gcloud config set project $env:GCP_PROJECT_ID

# Function to check if a bucket exists
function Test-BucketExists {
    param ($bucketName)
    $result = gcloud storage buckets describe "gs://$bucketName" 2>&1
    return ($LASTEXITCODE -eq 0)
}

# Create a Cloud Storage bucket if it doesn't exist
if (-not (Test-BucketExists $env:GCS_BUCKET_NAME)) {
    Write-Host "Creating Cloud Storage bucket: $env:GCS_BUCKET_NAME..."
    $output = gcloud storage buckets create "gs://$env:GCS_BUCKET_NAME" --location=$env:GCP_REGION 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ($output -match "HTTPError 409") {
            Write-Host "❌ ERROR: The bucket name '$env:GCS_BUCKET_NAME' is already in use.  GCS bucket names have to be unique globally (not just within your project)."
            Write-Host "Please choose a different bucket name in your .env file and try again."
            exit 1
        }
        else {
            Write-Host "❌ Failed to create bucket $env:GCS_BUCKET_NAME. Please check the error message above."
            exit 1
        }
    }
    
    Write-Host "✅ Bucket $env:GCS_BUCKET_NAME created successfully!"
    
    # Set up CORS for the bucket
    Write-Host "Setting up CORS configuration..."
    '[{"origin": ["*"], "method": ["GET"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600}]' | Out-File -Encoding utf8 cors.json

    if (gcloud storage buckets update gs://$env:GCS_BUCKET_NAME --cors-file=cors.json) {
        Write-Host "✅ CORS updated."
    } else {
        Write-Host "❌ Failed to update CORS configuration."
        Write-Host "Please verify that the service account has the 'Storage Admin' role and try again."
        Remove-Item cors.json
        exit 1
    }
    Remove-Item cors.json
} else {
    Write-Host "✅ Cloud Storage bucket $env:GCS_BUCKET_NAME already exists."
}

# Verify service account permissions
Write-Host "Verifying service account permissions..."
$SERVICE_ACCOUNT = gcloud config get-value account
Write-Host "Using service account: $SERVICE_ACCOUNT"

# Generate a Secure API Token
$API_TOKEN = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Encode the service account credentials in base64
$GCP_CERT = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("gcp-service-key.json"))

# Step: Gmail OAuth Setup
if ($env:INCLUDE_EMAIL_SETUP -eq "false") {
    Write-Host "Gmail setup skipped due to INCLUDE_EMAIL_SETUP"
} elseif ($env:GMAIL_REFRESH_TOKEN) {
    Write-Host "Gmail refresh token already provided — skipping Gmail authorization."
} else {
    Write-Host "Gmail refresh token not found. Starting one-time Gmail OAuth authorization..."

    # Construct consent URL
    $AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth?client_id=$env:GMAIL_CLIENT_ID&redirect_uri=http://localhost:3000/oauth2callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.modify&access_type=offline&prompt=consent"

    Write-Host ""
    Write-Host "Please open the following URL in your browser to authorize Gmail access:"
    Write-Host $AUTH_URL
    Write-Host ""
    Write-Host "After authorizing, you'll be redirected to:"
    Write-Host "    $env:GMAIL_REDIRECT_URI?code=XYZ..."
    Write-Host "Copy the 'code' parameter from that URL and paste it below."
    Write-Host ""

    # PowerShell Read-Host works with piped input, but let's be explicit
    try {
        $AUTH_CODE = Read-Host "Paste authorization code here"
    } catch {
        Write-Host "❌ ERROR: Unable to read input. Please run this script interactively."
        Write-Host "Download and run locally: wget https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/deploy-gcp.ps1"
        exit 1
    }

    Write-Host "Exchanging authorization code for tokens..."

    $RESPONSE = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method Post -Body @{
        code = $AUTH_CODE
        client_id = $env:GMAIL_CLIENT_ID
        client_secret = $env:GMAIL_CLIENT_SECRET
        redirect_uri = "http://localhost:3000/oauth2callback"
        grant_type = "authorization_code"
    }

    $GMAIL_REFRESH_TOKEN = $RESPONSE.refresh_token

    if (-not $GMAIL_REFRESH_TOKEN) {
        Write-Host "❌ ERROR: Failed to retrieve Gmail refresh token."
        Write-Host "Response: $RESPONSE"
        exit 1
    }

    Write-Host ""
    Write-Host "✅ Gmail authorization complete."
    Write-Host "Please set the GMAIL_REFRESH_TOKEN in your .env file to this value:"
    Write-Host ""
    Write-Host "GMAIL_REFRESH_TOKEN=$GMAIL_REFRESH_TOKEN"
    Write-Host ""
    Write-Host "Then rerun this setup script with:"
    Write-Host "curl -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/deploy-gcp.ps1 | powershell"
    exit 0
}

# Check if service already exists and get its URL
Write-Host "Checking if service already exists..."
$EXISTING_URL = gcloud run services describe $env:GCP_PROJECT_ID `
    --platform managed `
    --region=$env:GCP_REGION `
    --format "value(status.url)" 2>$null

if (-not $EXISTING_URL -or $EXISTING_URL -eq "") {
    Write-Host "Service not found - creating new one..."
} else {
    Write-Host "Service found at $EXISTING_URL - updating..."
}

# Deploy the container from Docker Hub
$IMAGE_NAME = "docker.io/drosenberg62/fvtt-fcb-backend:REPLACE_IMAGE_TAG"  # Github release action inserts the correct tag

# Create a temporary file for environment variables
# We do it this way because inbound whitelist has commas in it and trying to do it inline was a disaster
$ENV_FILE = [System.IO.Path]::GetTempFileName()
@"
GCP_PROJECT_ID: "$env:GCP_PROJECT_ID"
API_TOKEN: "$API_TOKEN"
OPENAI_API_KEY: "$env:OPENAI_API_KEY"
REPLICATE_API_KEY: "$env:REPLICATE_API_KEY"
GCS_BUCKET_NAME: "$env:GCS_BUCKET_NAME"
GCP_CERT: "$GCP_CERT"
INCLUDE_EMAIL_SETUP: "$env:INCLUDE_EMAIL_SETUP"
GMAIL_CLIENT_ID: "$env:GMAIL_CLIENT_ID"
GMAIL_CLIENT_SECRET: "$env:GMAIL_CLIENT_SECRET"
GMAIL_REFRESH_TOKEN: "$env:GMAIL_REFRESH_TOKEN"
INBOUND_WHITELIST: "$env:INBOUND_WHITELIST"
STORAGE_TYPE: "$env:STORAGE_TYPE"
AWS_BUCKET_NAME: "$env:AWS_BUCKET_NAME"
AWS_ACCESS_KEY_ID: "$env:AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY: "$env:AWS_SECRET_ACCESS_KEY"
AWS_REGION: "$env:AWS_REGION"
SERVER_URL: "$EXISTING_URL"
DEBUG: "false"
"@ | Out-File -FilePath $ENV_FILE -Encoding utf8

# Deploy the service
Write-Host "Deploying service to Cloud Run..."
gcloud run deploy $env:GCP_PROJECT_ID `
    --image $IMAGE_NAME `
    --platform managed `
    --region $env:GCP_REGION `
    --allow-unauthenticated `
    --env-vars-file "$ENV_FILE" `
    --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cloud Run deploy failed"
    Remove-Item "$ENV_FILE"
    exit 1
}

Write-Host "✅ Service deployed successfully!"

# Clean up the temporary file
Remove-Item "$ENV_FILE"

# Only update with SERVER_URL if this is a new service (no existing URL)
if (-not $EXISTING_URL -or $EXISTING_URL -eq "") {
    # Get the URL
    Write-Host "Getting service URL..."
    $SERVER_URL = gcloud run services describe $env:GCP_PROJECT_ID `
        --platform managed `
        --region=$env:GCP_REGION `
        --format "value(status.url)"

    Write-Host "Updating service with correct URL..."
    gcloud run services update $env:GCP_PROJECT_ID `
        --platform managed `
        --region=$env:GCP_REGION `
        --update-env-vars SERVER_URL=$SERVER_URL `
        --quiet
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to update service with SERVER_URL"
        exit 1
    }
    Write-Host "✅ Service updated with SERVER_URL successfully!"
} else {
    $SERVER_URL = $EXISTING_URL
}

# Clean up old revisions (keep only the 3 most recent)
Write-Host "Cleaning up old revisions..."
$OLD_REVISIONS = gcloud run revisions list `
    --service=$env:GCP_PROJECT_ID `
    --region=$env:GCP_REGION `
    --format="value(metadata.name)" `
    --sort-by="~metadata.creationTimestamp" `
    --limit=100 | Select-Object -Skip 3

if ($OLD_REVISIONS) {
    foreach ($revision in $OLD_REVISIONS) {
        Write-Host "  Deleting revision: $revision"
        gcloud run revisions delete $revision `
            --region=$env:GCP_REGION `
            --quiet
    }
    Write-Host "✅ Old revisions cleaned up successfully."
}

# Output success message
Write-Host "✅ Deployment complete! Your Foundry Campaign Builder backend is now live."
Write-Host "Use these settings in `"Advanced Settings`" for the module:"
Write-Host "URL: $SERVER_URL"
Write-Host "API Token: $API_TOKEN"
Write-Host "See README for final configuration steps."
