# Deploying GeminiPilot

This guide explains how to deploy the GeminiPilot platform, which consists of the Web Dashboard and the GitHub Action Bot.

## 1. Web Dashboard (Cloud Run)

The dashboard allows you to manage repositories and AI settings. It is designed to be deployed to Google Cloud Run.

### Prerequisites
- A Google Cloud Platform (GCP) project.
- A Firebase project with Firestore and Authentication (GitHub provider) enabled.
- Node.js 20+ installed locally.

### Step 1: GitHub OAuth App Configuration
To allow users to log in with GitHub:
1. Go to your GitHub **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. **Application name**: `GeminiPilot Dashboard`
3. **Homepage URL**: Your Cloud Run URL (or `http://localhost:3000` for testing).
4. **Authorization callback URL**: The OAuth redirect URI provided by your Firebase console.
5. Generate the **Client ID** and **Client Secret**.
6. Add these credentials to your Firebase Authentication GitHub Provider settings.

### Step 2: Deploy to Google Cloud Run
1. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. Deploy the service:
   ```bash
   gcloud run deploy geminipilot-dashboard \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GEMINI_API_KEY=your_gemini_api_key_here"
   ```

## 2. GeminiPilot GitHub Action (Bot)

The AI Bot runs autonomously as a GitHub Action inside repositories.

### Step 1: Repository Secrets
To use the bot, you must configure the following **Repository Secrets** in the target repository (`Settings > Secrets and variables > Actions`):
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `FIREBASE_API_KEY` (Optional): The API key for Firebase to load repository preferences from the dashboard.
- `PAT_TOKEN` (Optional): If you need the bot to trigger other workflows, supply a Personal Access Token instead of the default `GITHUB_TOKEN`.

### Step 2: Configure the Workflow
Create a file at `.github/workflows/geminipilot.yml` in your target repository:

```yaml
name: GeminiPilot Agent
on:
  issues:
    types: [opened, edited]
  issue_comment:
    types: [created]
  pull_request:
    types: [opened, synchronize]
  pull_request_review_comment:
    types: [created]

jobs:
  run-agent:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run GeminiPilot
        uses: your-github-username/geminipilot-action@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
```

### Marketplace Publication
To publish your Action to the GitHub Marketplace:
1. Ensure your `action.yml` has `name`, `description`, `author`, and `branding` fields.
2. Push your `action.yml` and `dist/index.js` to a public repository.
3. On GitHub, create a new Release.
4. Check the box "Publish this Action to the GitHub Marketplace" and select the appropriate categories.

## 3. GitHub App & Webhooks (Alternative Deployment)
If you prefer running the bot as a **GitHub App** that listens to webhooks (instead of an Action):
1. Go to **Settings > Developer settings > GitHub Apps > New GitHub App**.
2. **Webhook URL**: Set this to your Cloud Run endpoint `https://your-cloud-run-url/api/webhook`.
3. **Webhook Secret**: Generate a random string and save it.
4. **Permissions**: Give read/write access to Issues, Pull Requests, and Discussions.
5. **Subscribe to events**: Check `Issues`, `Issue comment`, `Pull request`, `Pull request review comment`.
6. Implement the webhook receiver in your `server.ts` to process events using the Gemini API and Octokit.
