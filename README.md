# Foundry Campaign Builder Backend

This is a backend service for providing advanced functionality to the fvtt-campaign-builder module (AI generation, specifically).  It requires the creation of a Google Cloud account but then automates
pretty much everything else other than some copy-and-pasting of configuration values.

The intent is to stay within the free tier of GCP.  Storage is 5GB free then ~$0.02 per GB after that.  Egress is 1GB free then $0.12/GB after that.

That's likely enough for most use cases, and pretty cheap for storage.  But if you're running frequent games with lots of players getting lots of images, you may hit the limits.

For heavy users, BackBlaze storage will be significantly cheaper (no free but only $0.005/GB for storage and $0.01/GB for egress), so we may add that as an option in the future.  Let me know 
if you're running into limits. 

## Quick Deployment
### Prerequisites

1. Setup Google Cloud
  - [Create a Google Cloud account](https://console.cloud.google.com/)
  - Enable the following services:
    - Cloud Run
    - Artifact Registry
    - IAM
    - Google Cloud Storage

2. Install Google Cloud CLI installed (`gcloud`)

### Deployment Steps
1. Deploy the backend

  - Run the following in your terminal:
    ```sh
    gcloud auth login
    gcloud config set project YOUR_GCP_PROJECT_ID
    gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/foundry-backend
    gcloud run deploy foundry-backend --image gcr.io/YOUR_GCP_PROJECT_ID/foundry-backend --platform managed --region us-central1 --allow-unauthenticated
    ```

2. Set environment variables
    ```sh
    gcloud run services update foundry-backend     --set-env-vars FOUNDRY_API_TOKEN=my-secret-token,AI_API_KEY=my-ai-api-key
    ```

3. Copy the API URL
  - Copy the generated API URL and paste it into Foundry VTT settings.

---------------

Notes on creating the docker image:
- Set up a **GitHub Secret** for GCP service account key (`GCP_SERVICE_ACCOUNT_KEY`).
- On every `git push`, the backend will auto-deploy.

