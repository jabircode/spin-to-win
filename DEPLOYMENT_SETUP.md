# GitHub Actions Deployment Setup Guide

This guide will help you set up automatic deployment to Google Cloud Run using GitHub Actions.

## Prerequisites

- A Google Cloud Platform (GCP) project
- Cloud Run service already created at: `https://sleekflow-spin-to-win-327054350441.asia-southeast1.run.app`
- GitHub repository for this code
- Permissions to manage GitHub repository secrets

## Step 1: Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **IAM & Admin > Service Accounts**
3. Click **Create Service Account**
4. Name it: `github-actions-deployer`
5. Grant the following roles:
   - **Cloud Run Admin** (roles/run.admin)
   - **Storage Admin** (roles/storage.admin) - for Container Registry
   - **Service Account User** (roles/iam.serviceAccountUser)

## Step 2: Create and Download Service Account Key

1. Click on the newly created service account
2. Go to **Keys** tab
3. Click **Add Key > Create new key**
4. Select **JSON** format
5. Download the JSON key file (keep it secure!)

## Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings > Secrets and variables > Actions**
3. Click **New repository secret**
4. Add the following secrets:

### Secret 1: GCP_PROJECT_ID
- **Name:** `GCP_PROJECT_ID`
- **Value:** Your GCP project ID (you can find this in the GCP Console dashboard)
- Example: `sleekflow-production-123456`

### Secret 2: GCP_SA_KEY
- **Name:** `GCP_SA_KEY`
- **Value:** The entire contents of the JSON key file you downloaded in Step 2
- Open the JSON file and copy **everything** (including the curly braces)
- It should look like:
  ```json
  {
    "type": "service_account",
    "project_id": "your-project-id",
    "private_key_id": "...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "github-actions-deployer@your-project.iam.gserviceaccount.com",
    ...
  }
  ```

## Step 4: Enable Required APIs

Make sure these APIs are enabled in your GCP project:

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

Or enable them via the [GCP Console](https://console.cloud.google.com/apis/library).

## Step 5: Test the Deployment

1. Make a small change to any file in the `spin-the-wheel` directory
2. Commit and push to the `main` or `master` branch:
   ```bash
   git add .
   git commit -m "Test deployment workflow"
   git push origin main
   ```
3. Go to your GitHub repository's **Actions** tab
4. You should see the "Deploy to Cloud Run" workflow running
5. Wait for it to complete (usually takes 2-5 minutes)
6. Visit your Cloud Run URL to verify the deployment

## Troubleshooting

### Authentication Errors
- Double-check that `GCP_SA_KEY` contains the complete JSON (including opening `{` and closing `}`)
- Verify the service account has all required roles

### Permission Errors
- Ensure the service account has Cloud Run Admin and Storage Admin roles
- Check that the APIs are enabled in your GCP project

### Build Errors
- Check the Dockerfile is working locally: `docker build -t test ./spin-the-wheel`
- Review the build logs in GitHub Actions

### Deployment Errors
- Verify the Cloud Run service exists and the region is correct (asia-southeast1)
- Check the service name matches: `sleekflow-spin-to-win`

## Manual Deployment (Alternative)

If you prefer to deploy manually using `gcloud` CLI:

```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and submit to Cloud Build
cd spin-the-wheel
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/sleekflow-spin-to-win

# Deploy to Cloud Run
gcloud run deploy sleekflow-spin-to-win \
  --image gcr.io/YOUR_PROJECT_ID/sleekflow-spin-to-win:latest \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

## Workflow File Location

The GitHub Actions workflow is located at:
```
.github/workflows/deploy-cloud-run.yml
```

You can modify this file to:
- Change the trigger branches
- Adjust deployment settings
- Add additional steps (like running tests before deployment)

## Security Best Practices

1. **Never commit** the service account JSON key to your repository
2. **Rotate** service account keys periodically
3. **Use** least privilege principle - only grant necessary permissions
4. **Monitor** deployments and set up alerts for failures
5. **Review** the GitHub Actions logs regularly
