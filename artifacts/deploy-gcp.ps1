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
    Write-Host ""
    Write-Host "Please install the missing dependencies using one of these methods:"
    Write-Host ""
    Write-Host "1. Install WSL (Windows Subsystem for Linux) and run the Linux version of the script"
    Write-Host "   This is the recommended approach. Install WSL by running in PowerShell as Administrator:"
    Write-Host "   wsl --install"
    Write-Host ""
    Write-Host "2. Install dependencies manually:"
    Write-Host "   - Install gcloud: Visit https://cloud.google.com/sdk/docs/install"
    Write-Host "   - Install OpenSSL: Download from https://slproweb.com/products/Win32OpenSSL.html"
    Write-Host "   - Install jq: Download from https://stedolan.github.io/jq/download/"
    Write-Host "   - Install curl: Download from https://curl.se/windows/"
    Write-Host ""
    Write-Host "After installing WSL, you can run the Linux version of the script with:"
    Write-Host "curl -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/deploy-gcp.sh | bash"
    exit 1
}

Write-Host "✅ All required dependencies are installed."

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
} else {
    Write-Host "❌ ERROR: .env file not found! Please download and edit the environment variables first. See the README for details."
    exit 1
}

# Check if service account key file exists
if (-not (Test-Path "gcp-service-key.json")) {
    Write-Host "❌ ERROR: Service account key file 'gcp-service-key.json' not found!"
    Write-Host "Please download your GCP service account key and place it in this directory - see README for more info."
    exit 1
}

# Authenticate with Google Cloud
Write-Host "Logging in to GCP..."
gcloud auth activate-service-account --key-file=gcp-service-key.json

# Set the Google Cloud Project
Write-Host "Setting up..."
gcloud config set project $env:GCP_PROJECT_ID

# Create a Cloud Storage bucket if it doesn't exist
Write-Host "Checking for Cloud Storage bucket..."
$bucketExists = gcloud storage buckets list --format="value(name)" | Select-String -Pattern "^$env:GCS_BUCKET_NAME$"

if (-not $bucketExists) {
    Write-Host "Creating Cloud Storage bucket: $env:GCS_BUCKET_NAME..."
    gcloud storage buckets create gs://$env:GCS_BUCKET_NAME --location=$env:GCP_REGION

    # need to open up CORS
    @'
[{"origin": ["*"], "method": ["GET"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600}]
'@ | Out-File -FilePath "cors.json" -Encoding utf8
    gcloud storage buckets update gs://$env:GCS_BUCKET_NAME --cors-file=cors.json
    Remove-Item cors.json
    
    Write-Host "✅ Bucket $env:GCS_BUCKET_NAME created successfully!"
} else {
    Write-Host "✅ Cloud Storage bucket $env:GCS_BUCKET_NAME already exists."
}

# Generate a Secure API Token
$API_TOKEN = -join ((48..57) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Encode the service account credentials in base64
$GCP_CERT = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("gcp-service-key.json"))

# Step: Gmail OAuth Setup
if ($env:INCLUDE_GMAIL_SETUP -eq "false") {
    Write-Host "Gmail setup skipped due to INCLUDE_GMAIL_SETUP"
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

    $AUTH_CODE = Read-Host "Paste authorization code here"

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

# Deploy the container from Docker Hub
Write-Host "Deploying container..."
$IMAGE_NAME = "docker.io/drosenberg62/fvtt-fcb-backend:REPLACE_IMAGE_TAG"  # Github release action inserts the correct tag

# get the deploy URL
$SERVER_URL = gcloud run services describe fvtt-fcb-backend --platform managed --region=us-central1 --format "value(status.url)"

# Prepare environment variables
$ENV_VARS = @"
GCP_PROJECT_ID=$env:GCP_PROJECT_ID,
API_TOKEN=$API_TOKEN,
OPENAI_API_KEY=$env:OPENAI_API_KEY,
REPLICATE_API_KEY=$env:REPLICATE_API_KEY,
GCS_BUCKET_NAME=$env:GCS_BUCKET_NAME,
GCP_CERT="$GCP_CERT",
INCLUDE_EMAIL_SETUP=$env:INCLUDE_EMAIL_SETUP,
GMAIL_REFRESH_TOKEN=$env:GMAIL_REFRESH_TOKEN,
STORAGE_TYPE=$env:STORAGE_TYPE,
AWS_BUCKET_NAME=$env:AWS_BUCKET_NAME,
AWS_ACCESS_KEY_ID=$env:AWS_ACCESS_KEY_ID,
AWS_SECRET_ACCESS_KEY=$env:AWS_SECRET_ACCESS_KEY,
AWS_REGION=$env:AWS_REGION,
SERVER_URL=$SERVER_URL
"@

gcloud run deploy fvtt-fcb-backend --image $IMAGE_NAME --platform managed --region $env:GCP_REGION --allow-unauthenticated --set-env-vars "$ENV_VARS"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Cloud run deploy failed"
    exit 1
}

# Output success message
Write-Host "✅ Deployment complete! Your Foundry Campaign Builder backend is now live."
Write-Host "Use these settings in 'Advanced Settings' for the module:"
Write-Host "URL: $SERVER_URL"
Write-Host "API Token: $API_TOKEN"
Write-Host "See README for final configuration steps." 