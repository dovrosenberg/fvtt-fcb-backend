#!/bin/bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/foundry-backend
gcloud run deploy foundry-backend --image gcr.io/YOUR_GCP_PROJECT_ID/foundry-backend --platform managed --region us-central1 --allow-unauthenticated
