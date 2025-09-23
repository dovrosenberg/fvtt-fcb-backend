# Foundry Campaign Builder Backend

This is a backend service for providing advanced functionality to the fvtt-campaign-builder module (AI generation, specifically).  It requires the creation of a Google Cloud account but then automates
pretty much everything else other than some copy-and-pasting of configuration values.

It supports Ubuntu/Debian (including WSL), MacOS (requires Homebrew), and Windows (requires Powershell).  Note: It has not been well-tested in Powershell.  I recommend using WSL for Windows if possible, but if you do use Powershell, file an issue if you run into trouble.

## Costs
The intent is to stay within the free tier of GCP.  Storage is 5GB free then ~$0.02 per GB after that.  Egress is 1GB free then $0.12/GB after that.

That's likely enough for most use cases, and pretty cheap for storage.  But if you're creating lots of images and/or runing frequent games with lots of players, you may hit the limits.  It can alternately store images in AWS S3.  So if you are already using that for Foundry, you can attach to the same bucket and avoid Google storage altogether.  This also lets Foundry work directly with the output file images.

For heavy users, BackBlaze storage would be significantly cheaper (no free but only $0.005/GB for storage and $0.01/GB for egress), so we could add that as an option in the future.  Let me know
if you're running into limits.



## 'Quick' Deployment
### Prerequisites (you'll only need to do this one time - not for every update)
There are lot of steps here, but if you follow the directions below, it should be pretty straightforward.

1. Setup Google Cloud

  - [Create a Google Cloud account](https://console.cloud.google.com/)
  - Go to the cloud overview dashboard
  - Create a new project - let's name it `FCB Backend`
    - Note the "project ID" that is generated when you put in the name - you can edit it, but don't need to
    - You will use this ID below (but will be able to find it again if you lose track of it now) 
  - Setup the services.  For each of these services, go to the link, make sure the right project is selected, and
    click "Enable".  They might each take a minute to run.
    - https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com
    - https://console.cloud.google.com/apis/library/run.googleapis.com
    - https://console.cloud.google.com/apis/library/storage.googleapis.com
    - https://console.cloud.google.com/apis/library/iam.googleapis.com


2. Install Google Cloud CLI (`gcloud`)
    
    https://cloud.google.com/sdk/docs/install

3. Create a service account and get credentials
  - Navigate to "IAM & Admin" in the dashboard or via this link: https://console.cloud.google.com/iam-admin/
  - Make sure you have the right project selected at the top, still
  - On the left side, select "Service Accounts"
  - Create a new service account:
    - Name (step 1): fcb-backend-service
    - Roles (step 2 - you can type these in the role box to find them, then click "Add another role"; you need the roles that exactly match these names):
      - Cloud Run Admin
      - Storage Admin
      - Service Account User
    - No need to grant users access (step 3)
  - In the list of users, click the email address of the new user.  Under "Keys" | "Add Key", select "Create new key"; select JSON and hit create
  - This will download the key file to your browser - move it into a temporary directory you'll be using below to deploy, and name it `gcp-service-key.json`

  4. Create accounts at openai.com and replicate.com

  5. Make sure you have openssl, jq, and curl installed:

      For Ubuntu/Debian:
      ```
      sudo apt-get update && sudo apt-get install -y openssl jq curl
      ```

      For MacOS:
      ```
      brew install openssl jq curl
      ```
  
### Set environment variables (You generally only need to do this once, but will need to update the file if you ever change any of your tokens)
  
1. Run this to download a template variable file.  Run it from the directory where you downloaded the key file in step 4 above.

    *Windows (Powershell):*

    ```
    curl.exe -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/env.template -o .env
    ```

    *Everything else:*

    ```
    curl -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/env.template -o .env
    ```

2. Edit the newly created .env file (in your favorite editor) to put in the needed settings (explained in more detail in the comments in the .env file).
      
### Deploy the backend (You'll just do this part whenever you want to upgrade to a new release of this backend)

**Notes:**
  - The next step might take a few minutes to run - especially after the line around Setting IAM Policy.
  - You may also see a warning: *Your active project does not match the quota project in your local Application Default Credentials file. This might result in unexpected quota issues*  You can ignore this.

 **For Ubuntu/Debian/WSL (recommended for Windows) or MacOS**
  - Run the following in your terminal (in MacOS, this requires Homebrew):
      ```sh
      curl -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/deploy-gcp.sh | bash
    ```
 
**For Windows Powershell users:**

  - Open PowerShell as Administrator
  - Run the following command:
    ```powershell
    curl.exe -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/deploy-gcp.ps1 | powershell
    ```
    ```powershell
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

### Setup Foundry (You'll do this after each deploy)
1. Copy the generated API URL (like `https://fvtt-fcb-backend-1018734923.us-central1.run.app` ) and token that are output from the deploy script and paste them into Foundry VTT settings.
2. If you ever need them again (ex. to add to a different Foundry world), you can find them at https://console.cloud.google.com/run?project=fcb-backend (click on the machine, then 'revisions' then the latest revision to see the token under 'environment variables')

### Adding email support
If you want to use email there are a few extra steps you need to take.  I highly recommend doing this after the initial deploy runs, though in theory you could probably do it as part of the initial deploy, I guess.

1. Create a free gmail account that you will send "to do" emails to (https://accounts.google.com/signup).  Make the password secure.  Do not set up 2FA.  Log into that account

2. Enable the gmail api - https://console.cloud.google.com/apis/api/gmail.googleapis.com/overview, make sure the right project is showing, then click "Enable".

3. Configure OAuth - https://console.cloud.google.com/auth/overview, make sure the right project is showing, and hit "Get Started".  
    
    (Step 1) Enter an App name (whatever you want - something like fcb-backend is fine), User Support Email is your gmail address - not the one you created 
    
    (Step 2-Audience) - choose External

    (Step 3 - Contact info) - your email address again.  Then agree to the question on step 4 and finish then hit Create.

4. Set the publishing status to production.  This will in theory open it to anyone to use the app, but there's not really any way for them to do that, since it's tied directly to your account.  For the more security-minded, here is my rationale for why this is safe:
  * The app redirects to an invalid link (localhost) so it's not actually providing access to anything directly - it can only be used to generate a refresh token, and it can only do that for a user who logs in with valid gmail credentials (and it will only be able to access that account)
  * You're creating your own client credentials, so there's no ability to mimic the app to do something else (make sure to keep your client id and secret secret)

5. Add OAuth Client - go to https://console.cloud.google.com/auth/clients, hit "Create Client" and pick "Web Application" as the type.  Give it a name - again something lik fcb-backend is fine.  Under "Authorized redirect URIs, add a URI and enter http://localhost:3000/oauth2callback.  Hit create.

6. **VERY IMPORTANT!!!** Copy the Client ID and Client secret into your .env file.  If you can't do that right now, copy them somewhere else safe in the meantime -- you won't be able to get the secret again later.  Then hit OK

7. Don't forget to set INCLUDE_EMAIL_SETUP to true in your env file.  Then rerun the deploy script 

    *Windows (Powershell):*

    ```
    curl.exe -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/env.template -o .env
    ```

    *Everything else:*

    ```
    curl -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/env.template -o .env
    ```    

    It will ask you to open a URL in the browser and prompt for a code.  Open that URL.  You will be asked to login.  **IMPORTANT!!!** You need to login with the gmail account you created for this - not your normal one. You will get a security warning.  Hit Continue.  You'll get another security warning.  Hit continue again.  You will get a "refused to connect" message - totally fine - don't close the window and see the next step.  

8. Find the code in the URL - it starts after the 'code=' and ends right before the '&scope'... copy everything in between and paste into the terminal where it's waiting for the auth code.  Copy the refresh token it gives you into your .env file. and rerun the deploy script 
    ```
    curl -sSL https://github.com/dovrosenberg/fvtt-fcb-backend/releases/latest/download/env.template -o .env
    ```

9. That's it!  You won't have to do this again for future deployments unless you wanted to change the email address.
    
### Using AWS S3 Instead of Google Cloud Storage (still need Google Cloud for everything else above)

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


