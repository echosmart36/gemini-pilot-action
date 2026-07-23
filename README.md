# GeminiPilot GitHub Action

An autonomous GitHub Copilot powered by Google Gemini that reviews code, answers questions, and solves issues directly within your repository.

## Features
- **Automated Code Review**: Reviews Pull Requests and provides constructive feedback.
- **Issue Triage & Answering**: Reads new issues and provides potential solutions or asks clarifying questions.
- **Configurable AI Models**: Integrates with a web dashboard to let you choose between fast models (e.g., Gemini 2.5 Flash) or high-reasoning models (e.g., Gemini 3.1 Pro Preview).
- **Centralized State Management**: Uses Firebase Firestore to manage preferences per repository.

## Setup Instructions

### 1. Web Dashboard Configuration
Visit the [GeminiPilot Dashboard](https://ais-dev-75q4f4nq5rwonmjmoegfia-149445108077.us-east5.run.app) to:
1. Connect your GitHub Account.
2. Select the repository where you want to deploy the action.
3. Configure the preferred AI model for your repository.

### 2. Add Secrets to your GitHub Repository
Go to your repository's **Settings > Secrets and variables > Actions** and add the following repository secrets:
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `FIREBASE_API_KEY`: (Optional) Your Firebase API Key if you want the action to sync preferences from the web dashboard.

### 3. Create the Workflow File
In your repository, create a file at `.github/workflows/gemini-agent.yml` with the following content:

```yaml
name: GeminiPilot Agent

on:
  issues:
    types: [opened, edited]
  issue_comment:
    types: [created]
  pull_request:
    types: [opened, synchronize]

jobs:
  gemini-agent:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - name: Run Gemini Agent
        uses: echosmart36/gemini-pilot-action@main
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
```

## How it Works
When an issue is opened or a PR is created/updated, this Action is triggered. It gathers the context of the issue or PR (including descriptions and comments) and sends it to the Gemini API. The AI model analyzes the request and posts a response directly to the GitHub thread.

## License
MIT
