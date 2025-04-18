# Foundry Campaign Builder Backend

This is a backend service for providing advanced functionality to the fvtt-campaign-builder module (AI generation, specifically).  It requires the creation of a Google Cloud account but then automates
pretty much everything else other than some copy-and-pasting of configuration values.

The intent is to stay within the free tier of GCP.  Storage is 5GB free then ~$0.02 per GB after that.  Egress is 1GB free then $0.12/GB after that.

That's likely enough for most use cases, and pretty cheap for storage.  But if you're running frequent games with lots of players getting lots of images, you may hit the limits.

For heavy users, BackBlaze storage will be significantly cheaper (no free but only $0.005/GB for storage and $0.01/GB for egress), so we may add that as an option in the future.  Let me know
if you're running into limits.

We also support AWS S3.  This is so that users already attaching S3 to Foundry can more easily manage the image files output by this backend.  It does not currently support other S3 providers - again, let me know if that's of interest.

## Quick Deployment
### Prerequisites

1. Setup Google Cloud

  - [Create a Google Cloud account](https://console.cloud.google.com/)
  - Go to the cloud overview dashboard
  - Create a new project - let's name it `FCB Backend`
    - Note the "project ID" that is generated when you put in the name - you can edit it, but don't need to
    - You will use this ID below (but will be able to find it again) 
  - Setup the services.  For each of these services, go to the link, make sure the right project is selected, and
    click "Enable".  They might each take a minute to run.
    - https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com
    - https://console.cloud.google.com/apis/library/run.googleapis.com
    - https://console.cloud.google.com/apis/library/storage.googleapis.com
    - https://console.cloud.google.com/apis/library/iam.googleapis.com

```
NEEDED?
  - Enable the following services:
    - Artifact Registry
    - IAM
```

2. Install Google Cloud CLI (`gcloud`)
    
    https://cloud.google.com/sdk/docs/install

3. Create a service account and get credentials
  - Inside the project dashboard, navigate to "IAM & Admin"
  - On the left side, select "Service Accounts"
  - Create a new service account:
    - Name: fcb-backend-service
    - Roles:
      - Cloud Run Admin
      - Storage Admin
      - Service Account User
    - No need to grant users access
  - Click on the new user and under "Add Key" select "Create new key"; select JSON
  - Download the key file - move it into a temporary directory you'll be using below to deploy, and name it `gcp-service-key.json`

### Deployment Steps
1. Set environment variables
  
  - Run this to download a template variable file
    ```sh
    curl -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/env.template -o .env
    ```

  - Edit the file to put in the needed settings:
    ```sh
    nano .env
    ```

  - THESE ARE THE SETTINGS THAT NEED TO BE POPULATED:
    ```
    # take from "Project ID" on the dashboard for the project in GCP console
    GCP_PROJECT_ID=fcb-backend

    # GCP region for cloud run deploy - put it close to you/your players
    GCP_REGION=us-central1

    # take from the 'client-email' field in the key file you download from GCP
    GCP_SERVICE_ACCT_EMAIL=fcb-backend-service@fcb-backend.iam.gserviceaccount.com

    # find in the list of service accounts after you enable the cloud storage service
    GCP_DEFAULT_STORAGE_ACCOUNT=101834528339-compute@developer.gserviceaccount.com

    # Storage Configuration - should match what you're going to put (or already have) in foundry configuration
    # See https://foundryvtt.com/article/aws-s3/ for more info
    GCS_BUCKET_NAME=fvtt-fcb-backend

    # it's a really long # - get from https://platform.openai.com
    OPENAI_API_KEY=sk-proj-SMCp9_Tu0keQ9T3Blbk...

    # Optional: AWS S3 Configuration
    # If you want to use AWS S3 instead of GCS, set STORAGE_TYPE=aws and provide the following:
    # STORAGE_TYPE=aws
    # AWS_BUCKET_NAME=your-bucket-name
    # AWS_ACCESS_KEY_ID=your-access-key-id
    # AWS_SECRET_ACCESS_KEY=your-secret-access-key
    # AWS_REGION=us-east-1
    ```

    Note: If you're using AWS S3, you can use the same credentials that you've configured for Foundry VTT's S3 integration. See https://foundryvtt.com/article/aws-s3 for more information on setting up an AWS S3 bucket.

2. Deploy the backend
  - Run the following in your terminal:
    ```sh
    curl -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/deploy-gcp.sh | bash
    ```

    This might take a few minutes - especially after the line around Setting IAM Policy.
    
    You may also see a warning: *Your active project does not match the quota project in your local Application Default Credentials file. This might result in unexpected quota issues*  You can ignore this.


3. Copy the API URL and token
  - Copy the generated API URL (like `https://fvtt-fcb-backend-1018734923.us-central1.run.app` ) and token that are output from the deploy script and paste them into Foundry VTT settings.
  - If you ever need them again, you can find them at https://console.cloud.google.com/run?project=fcb-backend (click on the machine, then 'revisions' then the latest revision to see the token under 'environment variables')

### Using AWS S3 Instead of GCS

If you prefer to use AWS S3 instead of Google Cloud Storage, follow these steps:

1. Set up an AWS S3 bucket
   - Follow the instructions at https://foundryvtt.com/article/aws-s3 to create and configure an S3 bucket
   - Make sure to configure the bucket policy and CORS settings as described in the Foundry VTT documentation

2. Update your `.env` file with AWS credentials
   - Add the following environment variables to your `.env` file:
     ```
     STORAGE_TYPE=aws
     AWS_BUCKET_NAME=your-bucket-name
     AWS_ACCESS_KEY_ID=your-access-key-id
     AWS_SECRET_ACCESS_KEY=your-secret-access-key
     AWS_REGION=us-east-1
     ```
   - You can use the same credentials that you've configured for Foundry VTT's S3 integration

3. Deploy the backend as described above
   - The deployment script will automatically detect and use your AWS configuration


---------------

Notes on creating the docker image:
- Set up a **GitHub Secret** for GCP service account key (`GCP_SERVICE_ACCOUNT_KEY`).
- On every `git push`, the backend will auto-deploy.

